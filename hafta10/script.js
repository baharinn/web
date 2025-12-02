console.clear();

// --- YENİ EKLENEN DEĞİŞKENLER ---
let totalScore = 0;
const historyListEl = document.getElementById("move-history");

// PASTA RENKLERİ PALETİ (Çilek, Çikolata, Vanilya, Fıstık, Limon, Böğürtlen)
const CAKE_COLORS = [
    0xFF99C8, // Pembe (Çilek)
    0x5D4037, // Koyu Kahve (Bitter Çikolata)
    0xFFF176, // Açık Sarı (Limon)
    0xC5E1A5, // Açık Yeşil (Fıstık)
    0xFFCCBC, // Somon (Karamel)
    0xCE93D8  // Mor (Böğürtlen)
];

function addHistoryItem(text, scoreValue, isPerfect) {
    const li = document.createElement("li");
    const colorClass = scoreValue > 0 ? "plus" : "minus";
    li.innerHTML = `<span>${text}</span> <strong class="${colorClass}">+${scoreValue}</strong>`;
    
    // Listeye ekle (En üste)
    historyListEl.insertBefore(li, historyListEl.firstChild);
    if (historyListEl.children.length > 8) {
        historyListEl.removeChild(historyListEl.lastChild);
    }
}

var Stage = /** @class */ (function () {
  function Stage() {
    var _this = this;
    this.container = document.getElementById("game");
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // ARKA PLAN RENGİ: Tatlı bir pastel mavi/krem
    this.renderer.setClearColor("#E0F7FA", 1); 
    
    this.container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    var aspect = window.innerWidth / window.innerHeight;
    var d = 20;
    this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
    this.camera.position.x = 2;
    this.camera.position.y = 2;
    this.camera.position.z = 2;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // IŞIK AYARLARI (Pastaların parlak görünmesi için)
    this.light = new THREE.DirectionalLight(0xffffff, 0.6);
    this.light.position.set(0, 499, 0);
    this.scene.add(this.light);
    this.softLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.softLight);
    
    this.render = function () { _this.renderer.render(_this.scene, _this.camera); };
    this.add = function (elem) { _this.scene.add(elem); };
    this.remove = function (elem) { _this.scene.remove(elem); };
    window.addEventListener("resize", function () { return _this.onResize(); });
    this.onResize();
  }
  Stage.prototype.setCamera = function (y, speed) {
    if (speed === void 0) { speed = 0.3; }
    TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut });
    TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
  };
  Stage.prototype.onResize = function () {
    var viewSize = 30;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.left = window.innerWidth / -viewSize;
    this.camera.right = window.innerWidth / viewSize;
    this.camera.top = window.innerHeight / viewSize;
    this.camera.bottom = window.innerHeight / -viewSize;
    this.camera.updateProjectionMatrix();
  };
  return Stage;
})();

var Block = /** @class */ (function () {
  function Block(block) {
    this.STATES = { ACTIVE: "active", STOPPED: "stopped", MISSED: "missed" };
    this.MOVE_AMOUNT = 12;
    this.dimension = { width: 0, height: 0, depth: 0 };
    this.position = { x: 0, y: 0, z: 0 };
    this.targetBlock = block;
    this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
    this.workingPlane = this.index % 2 ? "x" : "z";
    this.workingDimension = this.index % 2 ? "width" : "depth";
    this.dimension.width = this.targetBlock ? this.targetBlock.dimension.width : 10;
    this.dimension.height = this.targetBlock ? this.targetBlock.dimension.height : 2;
    this.dimension.depth = this.targetBlock ? this.targetBlock.dimension.depth : 10;
    this.position.x = this.targetBlock ? this.targetBlock.position.x : 0;
    this.position.y = this.dimension.height * this.index;
    this.position.z = this.targetBlock ? this.targetBlock.position.z : 0;
    
    // --- RENK DEĞİŞİKLİĞİ: PASTA RENKLERİ ---
    if (!this.targetBlock) {
      this.color = 0x8D6E63; // İlk taban rengi (Kek)
    } else {
      // Rastgele lezzetli bir renk seç
      var randomColor = CAKE_COLORS[Math.floor(Math.random() * CAKE_COLORS.length)];
      this.color = new THREE.Color(randomColor);
    }
    // ----------------------------------------
    
    this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;
    this.speed = -0.1 - this.index * 0.005;
    if (this.speed < -4) this.speed = -4;
    this.direction = this.speed;
    
    var geometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
    this.material = new THREE.MeshToonMaterial({ color: this.color, shading: THREE.FlatShading });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(this.position.x, this.position.y + (this.state == this.STATES.ACTIVE ? 0 : 0), this.position.z);
    if (this.state == this.STATES.ACTIVE) {
      this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
    }
  }
  Block.prototype.reverseDirection = function () {
    this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
  };
  Block.prototype.place = function () {
    this.state = this.STATES.STOPPED;
    var overlap = this.targetBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);
    var blocksToReturn = { plane: this.workingPlane, direction: this.direction, bonus: false };
    
    if (this.dimension[this.workingDimension] - overlap < 0.3) {
      overlap = this.dimension[this.workingDimension];
      blocksToReturn.bonus = true;
      this.position.x = this.targetBlock.position.x;
      this.position.z = this.targetBlock.position.z;
      this.dimension.width = this.targetBlock.dimension.width;
      this.dimension.depth = this.targetBlock.dimension.depth;
    }
    if (overlap > 0) {
      var choppedDimensions = { width: this.dimension.width, height: this.dimension.height, depth: this.dimension.depth };
      choppedDimensions[this.workingDimension] -= overlap;
      this.dimension[this.workingDimension] = overlap;
      var placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
      placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
      var placedMesh = new THREE.Mesh(placedGeometry, this.material);
      var choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
      choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2));
      var choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
      var choppedPosition = { x: this.position.x, y: this.position.y, z: this.position.z };
      if (this.position[this.workingPlane] < this.targetBlock.position[this.workingPlane]) {
        this.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
      } else {
        choppedPosition[this.workingPlane] += overlap;
      }
      placedMesh.position.set(this.position.x, this.position.y, this.position.z);
      choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);
      blocksToReturn.placed = placedMesh;
      if (!blocksToReturn.bonus) blocksToReturn.chopped = choppedMesh;
    } else {
      this.state = this.STATES.MISSED;
    }
    this.dimension[this.workingDimension] = overlap;
    return blocksToReturn;
  };
  Block.prototype.tick = function () {
    if (this.state == this.STATES.ACTIVE) {
      var value = this.position[this.workingPlane];
      if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT) this.reverseDirection();
      this.position[this.workingPlane] += this.direction;
      this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
    }
  };
  return Block;
})();

var Game = /** @class */ (function () {
  function Game() {
    var _this = this;
    this.STATES = { LOADING: "loading", PLAYING: "playing", READY: "ready", ENDED: "ended", RESETTING: "resetting" };
    this.blocks = [];
    this.state = this.STATES.LOADING;
    this.stage = new Stage();
    this.mainContainer = document.getElementById("container");
    this.scoreContainer = document.getElementById("score");
    this.startButton = document.getElementById("start-button");
    this.instructions = document.getElementById("instructions");
    this.scoreContainer.innerHTML = "0";
    this.newBlocks = new THREE.Group();
    this.placedBlocks = new THREE.Group();
    this.choppedBlocks = new THREE.Group();
    this.stage.add(this.newBlocks);
    this.stage.add(this.placedBlocks);
    this.stage.add(this.choppedBlocks);
    this.addBlock();
    this.tick();
    this.updateState(this.STATES.READY);
    document.addEventListener("keydown", function (e) { if (e.keyCode == 32) _this.onAction(); });
    document.addEventListener("click", function (e) { _this.onAction(); });
    document.addEventListener("touchstart", function (e) { e.preventDefault(); });
  }
  Game.prototype.updateState = function (newState) {
    for (var key in this.STATES) this.mainContainer.classList.remove(this.STATES[key]);
    this.mainContainer.classList.add(newState);
    this.state = newState;
  };
  Game.prototype.onAction = function () {
    switch (this.state) {
      case this.STATES.READY: this.startGame(); break;
      case this.STATES.PLAYING: this.placeBlock(); break;
      case this.STATES.ENDED: this.restartGame(); break;
    }
  };
  Game.prototype.startGame = function () {
    if (this.state != this.STATES.PLAYING) {
      this.scoreContainer.innerHTML = "0";
      totalScore = 0;
      historyListEl.innerHTML = "";
      this.updateState(this.STATES.PLAYING);
      this.addBlock();
    }
  };
  Game.prototype.restartGame = function () {
    var _this = this;
    this.updateState(this.STATES.RESETTING);
    var oldBlocks = this.placedBlocks.children;
    var removeSpeed = 0.2;
    var delayAmount = 0.02;
    var _loop_1 = function (i) {
      TweenLite.to(oldBlocks[i].scale, removeSpeed, { x: 0, y: 0, z: 0, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn, onComplete: function () { return _this.placedBlocks.remove(oldBlocks[i]); } });
      TweenLite.to(oldBlocks[i].rotation, removeSpeed, { y: 0.5, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn });
    };
    for (var i = 0; i < oldBlocks.length; i++) { _loop_1(i); }
    var cameraMoveSpeed = removeSpeed * 2 + oldBlocks.length * delayAmount;
    this.stage.setCamera(2, cameraMoveSpeed);
    var countdown = { value: totalScore };
    TweenLite.to(countdown, cameraMoveSpeed, {
      value: 0,
      onUpdate: function () { _this.scoreContainer.innerHTML = String(Math.round(countdown.value)); }
    });
    this.blocks = this.blocks.slice(0, 1);
    setTimeout(function () { _this.startGame(); }, cameraMoveSpeed * 1000);
  };
  
  // --- PUANLAMA MANTIĞI BURADA ---
  Game.prototype.placeBlock = function () {
    var _this = this;
    var currentBlock = this.blocks[this.blocks.length - 1];
    var newBlocks = currentBlock.place();
    this.newBlocks.remove(currentBlock.mesh);
    
    if (newBlocks.placed) {
        this.placedBlocks.add(newBlocks.placed);
        
        // Bonus (Mükemmel Yerleştirme) Kontrolü
        if (newBlocks.bonus) {
            totalScore += 50;
            addHistoryItem("Mükemmel Dilim!", 50, true);
        } else {
            totalScore += 10;
            addHistoryItem("Kek Eklendi", 10, false);
        }
        
        // Skoru güncelle
        this.scoreContainer.innerHTML = totalScore;
    } else {
        // Blok düştüyse
        addHistoryItem("Pasta Devrildi!", 0, false);
    }

    if (newBlocks.chopped) {
      this.choppedBlocks.add(newBlocks.chopped);
      var positionParams = { y: "-=30", ease: Power1.easeIn, onComplete: function () { return _this.choppedBlocks.remove(newBlocks.chopped); } };
      var rotateRandomness = 10;
      var rotationParams = { delay: 0.05, x: newBlocks.plane == "z" ? Math.random() * rotateRandomness - rotateRandomness / 2 : 0.1, z: newBlocks.plane == "x" ? Math.random() * rotateRandomness - rotateRandomness / 2 : 0.1, y: Math.random() * 0.1 };
      if (newBlocks.chopped.position[newBlocks.plane] > newBlocks.placed.position[newBlocks.plane]) { positionParams[newBlocks.plane] = "+=" + 40 * Math.abs(newBlocks.direction); } else { positionParams[newBlocks.plane] = "-=" + 40 * Math.abs(newBlocks.direction); }
      TweenLite.to(newBlocks.chopped.position, 1, positionParams);
      TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams);
    }
    this.addBlock();
  };
  
  Game.prototype.addBlock = function () {
    var lastBlock = this.blocks[this.blocks.length - 1];
    if (lastBlock && lastBlock.state == lastBlock.STATES.MISSED) { return this.endGame(); }
    var newKidOnTheBlock = new Block(lastBlock);
    this.newBlocks.add(newKidOnTheBlock.mesh);
    this.blocks.push(newKidOnTheBlock);
    this.stage.setCamera(this.blocks.length * 2);
    if (this.blocks.length >= 5) this.instructions.classList.add("hide");
  };
  Game.prototype.endGame = function () {
    this.updateState(this.STATES.ENDED);
  };
  Game.prototype.tick = function () {
    var _this = this;
    this.blocks[this.blocks.length - 1].tick();
    this.stage.render();
    requestAnimationFrame(function () { _this.tick(); });
  };
  return Game;
})();
var game = new Game();