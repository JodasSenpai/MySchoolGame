// Global variable definitionvar canvas;
var canvas;
var gl;
var shaderProgram;

// Buffers
var worldVertexPositionBuffer = null;
//var worldVertexTextureCoordBuffer = null;
var worldVertexIndexBuffer;
// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Variables for storing textures
var wallsVertexPositionBuffer = null;
var wallsVertexTextureCoordBuffer = null;


var npcVertexPositionBuffer;
var npcVertexTextureCoordBuffer;
var npcVertexIndexBuffer;
var npcShop;

var humanVertexPositionBuffer;
var humanVertexTextureCoordBuffer;
var humanVertexIndexBuffer;
var human;
var humanX = 0;
var humanZ = 0;
var humanY = 0;
var humanPrevX = 0;
var humanPrevZ = 0;
var humanFacing = 0;
var humanBonus = 1;
var speedBonus = 0.009;
var stepCounter = 0;
var stepIndex = 0;
var up = true;

var swordVertexPositionBuffer;
var swordVertexTextureCoordBuffer;
var swordVertexIndexBuffer;
var swordCounter = 0;
var swordAngle = 0;


var monsterFacing;
var monsterVertexPositionBuffer;
var monsterVertexTextureCoordBuffer;
var monsterVertexIndexBuffer;
var monsterX = 0;
var monsterZ = 0;
var monsters = [];
var startMonsters = [];

var texturesLoaded = 0;
var numTextures = 6;

var floorTexture;
var redTexture;
var blueTexture;
var wallTexture;
var npcTexture;
var swordTexture;


var currentlyPressedKeys = {};

var fight = false;
var pitch = 0;
var pitchRate = 0;
var yaw = 0;
var yawRate = 0;
var xPosition = 0;
var yPosition = 3.49;
var zPosition = 0.0;
var speed = 0;
var speedX = 0;
var speedZ = 0;

var startGame = false;
var mouseDown;
var mouseClick;
var fightTime = 0;
var lastTime = 0;
var fightCounter = 0;
var relaxCounter = 0;

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function initGL(canvas) {
  var gl = null;
  try {
    
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
}


function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }
  
  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
        shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  // start using shading program for rendering
  gl.useProgram(shaderProgram);
  
  // store location of aVertexPosition variable defined in shader
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");

  // turn on vertex position attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  // store location of aVertexNormal variable defined in shader
  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");

  // store location of aTextureCoord variable defined in shader
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix 
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  // store location of uMVMatrix variable defined in shader - model-view matrix 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  // store location of uSampler variable defined in shader
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}


function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function initTextures() {
  floorTexture = gl.createTexture();
  
  floorTexture.image = new Image();
  floorTexture.image.onload = function () {
    handleTextureLoaded(floorTexture);
  }
  floorTexture.image.src = "./assets/teren.png";


  wallTexture = gl.createTexture();
  
  wallTexture.image = new Image();
  wallTexture.image.onload = function () {
    handleTextureLoaded(wallTexture);
  }
  wallTexture.image.src = "./assets/wall.png";



  swordTexture = gl.createTexture();
  
  swordTexture.image = new Image();
  swordTexture.image.onload = function () {
    handleTextureLoaded(swordTexture);
  }
  swordTexture.image.src = "./assets/sword.png";

  redTexture = gl.createTexture();
    redTexture.image = new Image();
    redTexture.image.onload = function () {
        handleTextureLoaded(redTexture)
    };
    redTexture.image.src = "./assets/red.jpg";

  blueTexture = gl.createTexture();
    blueTexture.image = new Image();
    blueTexture.image.onload = function () {
        handleTextureLoaded(blueTexture)
    };
    blueTexture.image.src = "./assets/blue.jpg";

  npcTexture = gl.createTexture();
    npcTexture.image = new Image();
    npcTexture.image.onload = function () {
        handleTextureLoaded(npcTexture)
    };
    npcTexture.image.src = "./assets/yellow.jpg";
}



function handleTextureLoaded(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);

  
  texturesLoaded += 1;
}

//
// handleLoadedWorld
//
// Initialisation of world 
//
function handleLoadedWorld(humanData) {
  
  worldVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexTextureCoords), gl.STATIC_DRAW);
  worldVertexTextureCoordBuffer.itemSize = 2;
  
  worldVertexTextureCoordBuffer.numItems = humanData.vertexTextureCoords.length / 2;
  

  // Pass the vertex positions into WebGL
  worldVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexPositions), gl.STATIC_DRAW);
  worldVertexPositionBuffer.itemSize = 3;
  
  worldVertexPositionBuffer.numItems = humanData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  worldVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, worldVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(humanData.indices), gl.STATIC_DRAW);
  worldVertexIndexBuffer.itemSize = 1;
  worldVertexIndexBuffer.numItems = humanData.indices.length ;

  document.getElementById("loadingtext").textContent = "";
}
function handleLoadedWalls(data) {
  var lines = data.split("\n");
  var vertexCount = 0;
  var vertexPositions = [];
  var vertexTextureCoords = [];
  


  for (var i in lines) {
    var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
    if (vals.length == 5 && vals[0] != "//") {
      // It is a line describing a vertex; get X, Y and Z first
      vertexPositions.push(parseFloat(vals[0]));
      vertexPositions.push(parseFloat(vals[1]));
      vertexPositions.push(parseFloat(vals[2]));

      wallPositions.push([parseFloat(vals[0]), parseFloat(vals[2])]);
      // And then the texture coords
      vertexTextureCoords.push(parseFloat(vals[3]));
      vertexTextureCoords.push(parseFloat(vals[4]));

      vertexCount += 1;
    }
  }

  wallsVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wallsVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
  wallsVertexPositionBuffer.itemSize = 3;
  wallsVertexPositionBuffer.numItems = vertexCount;

  wallsVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wallsVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
  wallsVertexTextureCoordBuffer.itemSize = 2;
  wallsVertexTextureCoordBuffer.numItems = vertexCount;

  document.getElementById("loadingtext").textContent = "";
}

function handleLoadedHuman(humanData) {

  // Pass the texture coordinates into WebGL
  
  humanVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, humanVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexTextureCoords), gl.STATIC_DRAW);
  humanVertexTextureCoordBuffer.itemSize = 2;
  
  humanVertexTextureCoordBuffer.numItems = humanData.vertexTextureCoords.length / 2;
  

  // Pass the vertex positions into WebGL
  humanVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, humanVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexPositions), gl.STATIC_DRAW);
  humanVertexPositionBuffer.itemSize = 3;
  
  humanVertexPositionBuffer.numItems = humanData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  humanVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, humanVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(humanData.indices), gl.STATIC_DRAW);
  humanVertexIndexBuffer.itemSize = 1;
  humanVertexIndexBuffer.numItems = humanData.indices.length ;

  document.getElementById("loadingtext").textContent = "";
}

function handleLoadedNpc(humanData) {

  // Pass the texture coordinates into WebGL
  
  npcVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, npcVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexTextureCoords), gl.STATIC_DRAW);
  npcVertexTextureCoordBuffer.itemSize = 2;
  
  npcVertexTextureCoordBuffer.numItems = humanData.vertexTextureCoords.length / 2;
  

  // Pass the vertex positions into WebGL
  npcVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, npcVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexPositions), gl.STATIC_DRAW);
  npcVertexPositionBuffer.itemSize = 3;
  
  npcVertexPositionBuffer.numItems = humanData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  npcVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, npcVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(humanData.indices), gl.STATIC_DRAW);
  npcVertexIndexBuffer.itemSize = 1;
  npcVertexIndexBuffer.numItems = humanData.indices.length ;

  document.getElementById("loadingtext").textContent = "";
}
function handleLoadedSword(humanData) {

  // Pass the texture coordinates into WebGL
  
  swordVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, swordVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexTextureCoords), gl.STATIC_DRAW);
  swordVertexTextureCoordBuffer.itemSize = 2;
  
  swordVertexTextureCoordBuffer.numItems = humanData.vertexTextureCoords.length / 2;
  

  // Pass the vertex positions into WebGL
  swordVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, swordVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexPositions), gl.STATIC_DRAW);
  swordVertexPositionBuffer.itemSize = 3;
  
  swordVertexPositionBuffer.numItems = humanData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  swordVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, swordVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(humanData.indices), gl.STATIC_DRAW);
  swordVertexIndexBuffer.itemSize = 1;
  swordVertexIndexBuffer.numItems = humanData.indices.length ;

  document.getElementById("loadingtext").textContent = "";
}
function handleLoadedMonster(humanData) {

  // Pass the texture coordinates into WebGL
  
  monsterVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, monsterVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexTextureCoords), gl.STATIC_DRAW);
  monsterVertexTextureCoordBuffer.itemSize = 2;
  
  monsterVertexTextureCoordBuffer.numItems = humanData.vertexTextureCoords.length / 2;
  

  // Pass the vertex positions into WebGL
  monsterVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,monsterVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(humanData.vertexPositions), gl.STATIC_DRAW);
  monsterVertexPositionBuffer.itemSize = 3;
  
  monsterVertexPositionBuffer.numItems = humanData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  monsterVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, monsterVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(humanData.indices), gl.STATIC_DRAW);
  monsterVertexIndexBuffer.itemSize = 1;
  monsterVertexIndexBuffer.numItems = humanData.indices.length ;

  document.getElementById("loadingtext").textContent = "";
}

//
// loadWorld
//
// Loading world 
//
function loadWorld() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/terain.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedWorld(JSON.parse(request.responseText));
    }
  }
  request.send();
}
function loadWalls() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/world2.txt");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedWalls(request.responseText);
    }
  }
  request.send();
}
function loadMonster() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/human.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedMonster(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function loadHuman() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/human.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedHuman(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function loadNpc() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/human.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedNpc(JSON.parse(request.responseText));
    }
  }
  request.send();
}
function loadSword() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/sword.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedSword(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function buyBonus(){
  if(human.gold < 60){
    document.getElementById("alertMe").innerHTML = "Imate premalo zlata!";
    return;
  }
  if(Math.abs(humanPrevX - npcShop.x) < 0.15 && Math.abs(humanPrevZ - npcShop.z) < 0.15){
    human.gold -= 60;
    humanBonus += 5;  
  }
  else{
    document.getElementById("alertMe").innerHTML = "Niste pri NPC-ju!";
    return;
  }
  
}
function buySpeed(){
  if(human.gold < 30){
    document.getElementById("alertMe").innerHTML = "Imate premalo zlata!";
    return;
  }
  if(Math.abs(humanPrevX - npcShop.x) < 0.15 && Math.abs(humanPrevZ - npcShop.z) < 0.15){
    human.gold -= 30;
    speedBonus += 0.005;  
  }
  else{
    document.getElementById("alertMe").innerHTML = "Niste pri NPC-ju!";
    return;
  }
  
}
 function newGame(){
  startGame = true;
  xPosition = 0;
  zPosition = 2.0;
  humanX = 0;
  humanZ = 0;
  human.health = 100;
  human.gold = 0;
}
function Human(x, y, z, s) {
    
    this.x = x;
    this.y = y;
    this.z = z;
    this.s = s;

    this.health = 100;
    this.gold = 0;
    this.jumpCounter = 0;
    this.up = true;
    this.angle = 0;




    this.checkCollision = function () {
        var odmikZ = 0.1;
        var odmikX = 0.1;
        
       //[-2.645999999999998 ,-4.409999999999999]
        
        if(humanPrevX > 4.175 || humanPrevX < -4.466 || humanPrevZ > 4.582 || humanPrevZ < -4.45){
          
          return true;
        }
      
        for (var i = 0; i < monsters.length; i++) {
          if(Math.abs(humanPrevX - monsters[i].x) < 0.12 && Math.abs(humanPrevZ - monsters[i].z) < 0.12){
            return true;
          }
        }
        if(Math.abs(humanPrevX - npcShop.x) < 0.12 && Math.abs(humanPrevZ - npcShop.z) < 0.12){

          return true;
        }
        return false;
        
    };

    this.getDammage = function () {

        this.health -= Math.floor(10 * Math.random());

    };

    this.getHP = function(){
      return this.health;
    }

}


function NPC(x, y, z, s) {
    
    this.x = x;
    this.y = y;
    this.z = z;
    this.s = s;

    this.npcFacing = 0;

    this.jumpCounter = 0;

    this.checkCollision = function () {
      if(Math.abs(humanPrevX - this.x) < 0.15 && Math.abs(humanPrevZ - this.z) < 0.15){
        return true;
      }
      return false;
    };
}

function Monster(x, y, z, s) {
    
    this.x = x;
    this.y = y;
    this.z = z;
    this.s = s;

    this.health = 100;

    this.moving = 1;//Math.floor(1 + Math.random() * 4);
    this.stepCounter = 0;
    this.collision = false;
    this.monsterUp = true;
    this.monsterFacing = 0;
    this.monsterAngle = 0;
    this.checkCollision = function () {
        var odmik = 0.4;
        
        if(Math.abs(humanX - this.x) < odmik && Math.abs(humanZ - this.z) < odmik){
            return true;
        }

        return false;
        
        
    };

    this.getDammage = function () {
        this.health = Math.floor(humanBonus * 10 * Math.random());
    };

}




function initHumanPositions() {
    human = new Human(-9, 0, -9, 1);
}

function initMonsterPositions() {
    monsters.push(new Monster(2, 0, 1, 1));
    monsters.push(new Monster(1, 0, -2, 1));
    monsters.push(new Monster(-2, 0, -2, 1));
    monsters.push(new Monster(-2.5, 0, 2, 1));
    monsters.push(new Monster(1, 0, 2, 1));
    monsters.push(new Monster(-1.7, 0, -2, 1));
    monsters.push(new Monster(2, 0, 0, 1));
    monsters.push(new Monster(0.8, 0, -0.7, 1));
    monsters.push(new Monster(-2.44, 0, 0.39, 1));

    startMonsters.push([2, 0, 1, 1]);
    startMonsters.push([1, 0, -2, 1]);
    startMonsters.push([-2, 0, -2, 1]);
    startMonsters.push([-2.5, 0, 2, 1]);
    startMonsters.push([1, 0, 2, 1]);
    startMonsters.push([-1.7, 0, -2, 1]);
    startMonsters.push([2, 0, 0, 1]);
    startMonsters.push([0.8, 0, -0.7, 1]);
    startMonsters.push([-2.44, 0, 0.39, 1]);
}
function initNpcPositions() {
    npcShop = new NPC(0, 0, 4, 1);
}


function drawHuman(x, y, z, s) {

    // Save the current matrix, then rotate before we draw.
    mvPushMatrix();

    mat4.translate(mvMatrix, [x, y, z]);
    mat4.rotate(mvMatrix, degToRad(human.angle), [0, 0, 1]);
    mat4.rotate(mvMatrix, degToRad(humanFacing), [0, 1, 0]);


    mat4.scale(mvMatrix, [0.09, 0.09, 0.09]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, humanVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, humanVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, humanVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, humanVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_2D, blueTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, humanVertexIndexBuffer);

    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, humanVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    // Restore the original matrix
    mvPopMatrix();
}
function drawSword(x, y, z) {

    // Save the current matrix, then rotate before we draw.
    mvPushMatrix();

    mat4.translate(mvMatrix, [x, y, z]); 
    mat4.rotate(mvMatrix, degToRad(swordAngle), [0, 1, 0]);
   
    mat4.scale(mvMatrix, [0.09, 0.09, 0.09]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, swordVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, swordVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, swordVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, swordVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_2D, swordTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, swordVertexIndexBuffer);

    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, swordVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    // Restore the original matrix
    mvPopMatrix();
}
function drawNpc(x, y, z, s) {

    // Save the current matrix, then rotate before we draw.
    mvPushMatrix();

    mat4.translate(mvMatrix, [x, y, z]);
    mat4.rotate(mvMatrix, degToRad(npcShop.npcFacing), [0, 1, 0]);
    mat4.scale(mvMatrix, [0.09, 0.09, 0.09]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, npcVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, npcVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, npcVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, npcVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_2D, npcTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, npcVertexIndexBuffer);

    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, npcVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    // Restore the original matrix
    mvPopMatrix();
}



function drawMonster(x, y, z, i) {

    // Save the current matrix, then rotate before we draw.
    mvPushMatrix();
    if(!monsters[i].checkCollision()){
      if(monsters[i].moving == 1){
        x = x + 0.005;
        monsters[i].monsterFacing = 90;
        if(startMonsters[i][0] + 0.6 < x){
          monsters[i].moving += 1;
        }
      }
      else if(monsters[i].moving == 2){
        z = z + 0.005;
        monsters[i].monsterFacing = 0;
        if(startMonsters[i][2] + 0.6 < z){
          monsters[i].moving += 1;
        }
      }
      else if(monsters[i].moving == 3){
        x = x - 0.005;
        monsters[i].monsterFacing = 270;
        if(startMonsters[i][0] >= x){
          monsters[i].moving += 1;
        }
      }
      else if(monsters[i].moving == 4){
        z = z - 0.005;
        monsters[i].monsterFacing = 180;
        if(startMonsters[i][2] >= z){
          monsters[i].moving = 1;
        }
      }

      if(monsters[i].monsterCounter < 30){
        monsters[i].monsterCounter ++;
      }
      else{
        monsters[i].monsterCounter = 0;
        monsters[i].monsterUp = !monsters[i].monsterUp;
      }
      if(monsters[i].monsterUp){
        monsters[i].monsterFacing +=monsters[i].monsterCounter;
      }
      else{
        monsters[i].monsterFacing -=monsters[i].monsterCounter;
      }
      
      monsters[i].collision = false;
      mat4.translate(mvMatrix, [x, y, z]);
      mat4.rotate(mvMatrix, degToRad(monsters[i].monsterFacing), [0, 1, 0]);
      
    }
    else{
      monsters[i].collision = true;
      mat4.translate(mvMatrix, [x, y, z]);
      if(humanFacing > 180){
        monsters[i].monsterFacing = humanFacing - 180;
      }
      if(humanFacing < 181){
        monsters[i].monsterFacing = humanFacing + 181;
      }
      
      
      if(monsters[i].monsterCounter < 7){
        monsters[i].monsterCounter ++;
      }
      else{
        monsters[i].monsterCounter = 0;
        monsters[i].monsterUp = !monsters[i].monsterUp;
      }
      if(monsters[i].monsterUp){
        monsters[i].monsterAngle +=40.00;
      }
      else{
        monsters[i].monsterAngle -=40.0;
      }
      mat4.rotate(mvMatrix, degToRad(monsters[i].monsterAngle), [0, 0, 0]);
      mat4.rotate(mvMatrix, degToRad(monsters[i].monsterAngle), [1, 0, 1]);
      mat4.rotate(mvMatrix, degToRad(monsters[i].monsterFacing), [0, 1, 0]);

    }
    
    
    mat4.scale(mvMatrix, [0.09, 0.09, 0.09]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, monsterVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, monsterVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, humanVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, monsterVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_2D, redTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, monsterVertexIndexBuffer);

    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, monsterVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    // Restore the original matrix
    
    mvPopMatrix();
    return [x,z];
}

function drawFloor() {

    
    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_2D, floorTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, worldVertexIndexBuffer);

    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, worldVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);








}

function drawWalls() {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);


  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, wallsVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, wallsVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Draw the world by binding the array buffer to the world's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, wallsVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, wallsVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Draw the cube.
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, wallsVertexPositionBuffer.numItems);
}
//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // set the rendering environment to full canvas size
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // If buffers are empty we stop loading the application.
  if (worldVertexTextureCoordBuffer == null || worldVertexPositionBuffer == null) {
    return;
  }
  
  

  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  mat4.identity(mvMatrix);


  mat4.rotate(mvMatrix, degToRad(60), [1, 0, 0]);
  mat4.translate(mvMatrix, [-xPosition, -yPosition, -zPosition]);

  // Activate textures
  //console.log(stepCounter);
  //console.log(humanY);
  drawHuman(humanX,humanY,humanZ,1);
  for(var i=0; i<monsters.length;i++){
    if(monsters[i].collision == true){
      
      if(swordCounter < 25){
          swordCounter ++;
      }
      else{
          swordCounter = 0;
      }
      if(swordAngle > 355){
        swordAngle = 0;
      }
      swordAngle += swordCounter; 
      drawSword(humanX, 0.2, humanZ);
      
    }
  }

  if(humanFacing > 180){
        npcShop.npcFacing = humanFacing - 180;

      }
  else if(humanFacing < 181){
        npcShop.npcFacing = humanFacing + 181;
  }

if(!npcShop.checkCollision()){
  if(npcShop.jumpCounter < 25){
      npcShop.jumpCounter ++;
    }
  else{
      npcShop.jumpCounter = 0;
      npcShop.jumpUp = !npcShop.jumpUp;
  }
  if(npcShop.jumpUp){
      npcShop.y += 0.004;
  }
  else{
      npcShop.y -= 0.004;
  }
  }
  else{
    npcShop.y = 0;
  }


  drawNpc(npcShop.x,npcShop.y,npcShop.z,1);
  for (var i = 0; i < monsters.length; i++) {
      
      monsterX = monsters[i].x;
      monsterZ = monsters[i].z;
      
      var mon = drawMonster(monsterX,0,monsterZ,i);
      monsters[i].x = mon[0];
      monsters[i].z = mon[1];
  }
  drawFloor();
  //drawWalls();
  if(human.health >= 0){
  document.getElementById("playerHP").innerHTML = "Your health: "+ Math.floor(human.health);
  }
  else{
    document.getElementById("playerHP").innerHTML = "Your health: 0";
  }
  document.getElementById("playerGold").innerHTML = "Your gold: "+ Math.floor(human.gold);
  document.getElementById("playerBonus").innerHTML = "Your bonus: " + humanBonus;
  
}

//
// animate
//
// Called every time before redeawing the screen.
//
function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;
    if (speedX != 0 || speedZ != 0 ) {
      humanPrevX = humanX + speedX;
      humanPrevZ = humanZ + speedZ;
      if(!human.checkCollision() ){
        
        xPosition = xPosition + speedX;
        zPosition = zPosition + speedZ;
        humanX = humanPrevX;
        humanZ = humanPrevZ;
        human.angle = 0;
      }
    }

    else{
      if(human.jumpCounter < 40){
        human.jumpCounter ++;
      }
      else{
        human.jumpCounter = 0;
        human.up = !human.up;
      }
      if(human.up){
       human.angle +=0.10;
      }
      else{
        human.angle -= 0.10;
      }
    }
    
    }
    yaw += yawRate * elapsed;
    pitch += pitchRate * elapsed;
    lastTime = timeNow;
}



//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start() {
  canvas = document.getElementById("glcanvas");

  gl = initGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
    gl.clearDepth(1.0);                                     // Clear everything
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

    initHumanPositions();
    initNpcPositions();
    initMonsterPositions();
    initShaders();
    initTextures();

    loadHuman();
    loadSword();
    loadMonster();
    loadNpc();
    loadWorld();
    
    
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    canvas.onclick = handleMouseClick;
    canvas.onmousedown = handleMouseDown;
    canvas.onmouseup = handleMouseUp;
    
    
    setInterval(function() {
      if (texturesLoaded === numTextures && startGame) { // only draw scene and animate when textures are loaded.
        requestAnimationFrame(animate);
        handleKeys();
               
        drawScene();
        if(fightCounter >= 15){
          fightCounter = 0;
        }
        if(relaxCounter >= 60){
          relaxCounter = 0;
        }
        for(var i=0; i<monsters.length;i++){
          if(monsters[i].collision == true && fightCounter >= 10){
            if(human.health < 1){
              document.getElementById("playerHP").innerHTML = "Your health: 0";
              human = null;
              initHumanPositions();
              startGame = false;
              
            }
            else{
              human.health -= Math.floor(1.5 * Math.random());  
            }
            if(Math.floor(monsters[i].health)>= 0){
              document.getElementById("monsterHP").innerHTML = "Monster HP: "+Math.floor(monsters[i].health);
            }
            else{
              document.getElementById("monsterHP").innerHTML = "Monster HP: 0"; 
            }
          }
          
        }
        var col = false;
        for (var i = 0; i < monsters.length; i++) {
          
          if(monsters[i].collision == true){
            col = true;
            break;
          }
        }
        if (relaxCounter >= 45 && human.health < 100 && col == false) {
              human.health += 0.1;
        }
        relaxCounter++;
        fightCounter++;
        if(monsters.length == 0){
          initMonsterPositions();
        }
      }
    }, 15);
    
  }
}


function handleKeyDown(event) {
  // storing the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
  // reseting the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = false;
}


function handleKeys() {


  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
    // Left cursor key or A
    speedX = -speedBonus;
    speedZ = 0;
    humanFacing = 270;
    if(stepCounter < 25){
      stepCounter ++;
    }
    else{
      stepCounter = 0;
      up = !up;
    }
    
    if(up){
      humanFacing +=stepCounter ;
      humanY += 0.004;
    }
    else{
      humanFacing -=stepCounter ;
      humanY -= 0.004;
    }
  } 
  else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
    // Right cursor key or D
    speedX = speedBonus;
    speedZ = 0;
    humanFacing = 90;
    if(stepCounter < 25){
      stepCounter ++;
    }
    else{
      stepCounter = 0;
      up = !up;
    }
    if(up){
      humanFacing +=stepCounter;
      humanY += 0.004;
    }
    else{
      humanFacing -=stepCounter;
      humanY -= 0.004;
    }
    
  } 
  else if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
    // Up cursor key or W
    speedX = 0;
    speedZ = -speedBonus;
    humanFacing = 0;
    if(stepCounter < 25){
      stepCounter ++;
    }
    else{
      stepCounter = 0;
      up = !up;
    }
    if(up){
      humanFacing +=stepCounter;
      humanY += 0.004;
    }
    else{
      humanFacing -=stepCounter;
      humanY -= 0.004;
    }
    
  }
  else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
    // Down cursor S
    speedX = 0;
    speedZ = speedBonus;
    humanFacing = 180;
    if(stepCounter < 25){
      stepCounter ++;
    }
    else{
      stepCounter = 0;
      up = !up;
    }
    if(up){
      humanFacing +=stepCounter;
      humanY += 0.004;
    }
    else{
      humanFacing -=stepCounter;
      humanY -= 0.004;
    }
      
  }
   else {
    speedX = 0;
    speedZ  = 0;
    humanY = 0;
  }
}






function handleMouseUp(event) {
  mouseDown = false;
}

function handleMouseDown(event) {
  mouseDown = true;
}

function handleMouseClick(event) {
     for(var i=0; i<monsters.length;i++){
          if(monsters[i].collision == true){

            
            
            fight = true;
            monsters[i].health -= Math.floor(humanBonus + (1.5 * Math.random()));
            
            if(monsters[i].health <= 0){
              human.gold += 30;
              monsters.splice(i,1); 
              startMonsters.splice(i,1);1
            }
            
          }

        }
}
  