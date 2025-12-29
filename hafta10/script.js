console.clear();

// -------------------- GLOBALS --------------------
let totalScore = 0;
const historyListEl = document.getElementById("move-history");

// Pasta renkleri
const CAKE_COLORS = [
  0xFF99C8,
  0x5D4037,
  0xFFF176,
  0xC5E1A5,
  0xFFCCBC,
  0xCE93D8
];

function addHistoryItem(text, scoreValue) {
  const li = document.createElement("li");
  const colorClass = scoreValue > 0 ? "plus" : "minus";
  li.innerHTML = `<span>${text}</span><strong class="${colorClass}">+${scoreValue}</strong>`;
  historyListEl.prepend(li);
  if (historyListEl.children.length > 8) {
    historyListEl.removeChild(historyListEl.lastChild);
  }
}

// -------------------- STAGE --------------------
class Stage {
  constructor() {
    this.container = document.getElementById("game");
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor("#E0F7FA", 1);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const d = 20;

    this.camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      -100,
      1000
    );

    this.camera.position.set(2, 2, 2);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.DirectionalLight(0xffffff, 0.6));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    window.addEventListener("resize", () => this.onResize());
    this.onResize();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  add(obj) {
    this.scene.add(obj);
  }

  remove(obj) {
    this.scene.remove(obj);
  }

  setCamera(y, speed = 0.3) {
    gsap.to(this.camera.position, {
      duration: speed,
      y: y + 4,
      ease: "power1.inOut"
    });

    gsap.to(this.camera, {
      duration: speed,
      onUpdate: () => this.camera.lookAt(0, y, 0)
    });
  }

  onResize() {
    const viewSize = 30;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.left = window.innerWidth / -viewSize;
    this.camera.right = window.innerWidth / viewSize;
    this.camera.top = window.innerHeight / viewSize;
    this.camera.bottom = window.innerHeight / -viewSize;
    this.camera.updateProjectionMatrix();
  }
}

// -------------------- BLOCK --------------------
class Block {
  constructor(target) {
    this.STATES = { ACTIVE: "active", STOPPED: "stopped", MISSED: "missed" };
    this.target = target;
    this.index = target ? target.index + 1 : 0;
    this.workingPlane = this.index % 2 ? "x" : "z";
    this.workingDimension = this.index % 2 ? "width" : "depth";

    this.dimension = {
      width: target ? target.dimension.width : 10,
      height: 2,
      depth: target ? target.dimension.depth : 10
    };

    this.position = {
      x: target ? target.position.x : 0,
      y: this.dimension.height * this.index,
      z: target ? target.position.z : 0
    };

    this.color = target
      ? new THREE.Color(CAKE_COLORS[Math.floor(Math.random() * CAKE_COLORS.length)])
      : new THREE.Color(0x8D6E63);

    this.state = this.index > 0 ? this.STATES.ACTIVE : this.STATES.STOPPED;
    this.speed = Math.max(-0.1 - this.index * 0.005, -4);
    this.direction = this.speed;

    const geo = new THREE.BoxGeometry(
      this.dimension.width,
      this.dimension.height,
      this.dimension.depth
    );
    geo.translate(
      this.dimension.width / 2,
      this.dimension.height / 2,
      this.dimension.depth / 2
    );

    this.mesh = new THREE.Mesh(
      geo,
      new THREE.MeshToonMaterial({ color: this.color })
    );

    if (this.state === this.STATES.ACTIVE) {
      this.position[this.workingPlane] = Math.random() > 0.5 ? -12 : 12;
    }

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
  }

  reverseDirection() {
    this.direction = -this.direction;
  }

  tick() {
    if (this.state !== this.STATES.ACTIVE) return;
    this.position[this.workingPlane] += this.direction;
    if (Math.abs(this.position[this.workingPlane]) > 12) this.reverseDirection();
    this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
  }

  place() {
    this.state = this.STATES.STOPPED;
    const overlap =
      this.target.dimension[this.workingDimension] -
      Math.abs(
        this.position[this.workingPlane] -
          this.target.position[this.workingPlane]
      );

    if (overlap <= 0) return { missed: true };

    const bonus =
      this.dimension[this.workingDimension] - overlap < 0.3;

    if (bonus) {
      this.position.x = this.target.position.x;
      this.position.z = this.target.position.z;
    }

    this.dimension[this.workingDimension] = overlap;
    return { placed: this.mesh, bonus };
  }
}

// -------------------- GAME --------------------
class Game {
  constructor() {
    this.STATES = { READY: "ready", PLAYING: "playing", ENDED: "ended" };
    this.blocks = [];
    this.stage = new Stage();
    this.container = document.getElementById("container");
    this.scoreEl = document.getElementById("score");

    this.addBlock();
    this.updateState(this.STATES.READY);
    this.loop();

    document.addEventListener("click", () => this.action());
    document.addEventListener("keydown", e => e.code === "Space" && this.action());
  }

  updateState(state) {
    Object.values(this.STATES).forEach(s =>
      this.container.classList.remove(s)
    );
    this.container.classList.add(state);
    this.state = state;
  }

  action() {
    if (this.state === this.STATES.READY) this.start();
    else if (this.state === this.STATES.PLAYING) this.place();
    else if (this.state === this.STATES.ENDED) location.reload();
  }

  start() {
    totalScore = 0;
    historyListEl.innerHTML = "";
    this.scoreEl.textContent = "0";
    this.updateState(this.STATES.PLAYING);
    this.addBlock();
  }

  place() {
    const current = this.blocks[this.blocks.length - 1];
    const result = current.place();

    if (result.missed) {
      this.updateState(this.STATES.ENDED);
      return;
    }

    totalScore += result.bonus ? 50 : 10;
    this.scoreEl.textContent = totalScore;
    addHistoryItem(result.bonus ? "Mükemmel Dilim!" : "Kek Eklendi", result.bonus ? 50 : 10);

    this.addBlock();
  }

  addBlock() {
    const last = this.blocks[this.blocks.length - 1];
    const block = new Block(last);
    this.blocks.push(block);
    this.stage.add(block.mesh);
    this.stage.setCamera(this.blocks.length * 2);
  }

  loop() {
    this.blocks[this.blocks.length - 1].tick();
    this.stage.render();
    requestAnimationFrame(() => this.loop());
  }
}

// -------------------- START --------------------
new Game();
