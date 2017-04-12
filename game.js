  //creamos la función base del juego
  //al cual le pasamos el id del canvas donde vamos a jugar
  var Game = function(canvasId, runGame) {
    //si se va a iniciar el juego
    if(runGame){
      //limpiamos la pantalla
      clearScreen();
    }
    //seleccionamos el canvas con el id que pasamos
    var canvas = document.getElementById(canvasId);
    //definimos el contexto para dibujar
    //en este caso es un contexto 2d
    var screen = canvas.getContext('2d');
    //guardamos el ancho y el alto del canvas para posicionar objetos
    var gameSize = {x: canvas.width, y: canvas.height };

    this.runGame = runGame || false;
    //declaramos un arreglo donde vamos a guardar todos los objetos
    //y le pasamos los invaders y el jugador
    this.bodies = createInvaders(this).concat(new Player(this, gameSize));

    var self = this;
    //escuchamos cuando el boton de inicio sea apretado
    document.getElementById('start').onclick = function(){
      //limpiamos la pantalla
      clearScreen();
      //iniciamos el juego
      self.runGame = true;
    };
    //declaramos una función principal para correr la lógica
    //esta función va a correr 60veces por segundo
    var tick = function(){
      if(self.runGame){
        //actualizamos la información del juego
        self.update();
        //dibujamos el juego
        self.draw(screen, gameSize);
      }
      //le pedimos al navegador que lo haga 60 veces por segundo
      requestAnimationFrame(tick);
    };

    tick();
  };

  //Vamos a construir las funciones que va a tener la función Game
  Game.prototype = {
    //definimos la funcion update de Game
    update: function() {
      //metemos los objetos en una variable para accesarlos
      var bodies = this.bodies;
      //hacemos una función para ver que objetos no colisionan
      //a esta funcion le pasamos un objeto 1
      var notCollidingWithAnything = function(b1) {
        //utilizando la funcion colliding que está al final del documento
        //checamos cuales de los objetos colisionan con el objeto 1
        //si ninguna de las condiciones regresó un true
        //entonces significa que el objeto no colisiona con nada
        return bodies.filter(function(b2) {
            return colliding(b1,b2);
          }).length === 0;
      };
      //guardamos los objetos que no colisionan en un arreglo
      //para despues ver si aún están en pantalla
      var notColliding = [];
      notColliding = this.bodies.filter(notCollidingWithAnything);
      //guardamos los objetos que ahora son parte del juego
      //porque no colisionaron ni han salido de la pantalla
      var newBodies = [];
      newBodies = notColliding.filter(offScreen);
      //limpiamos los objetos
      this.bodies = [];
      //agregamos los objetos que no colisionaron
      this.bodies = newBodies;
      //buscamos si el ojeto player aparece en los objetos que no colisionan
      var isPlayerAlive;
      var areInvadersAlive;
      //iteramos dentro del array de objetos
      for (var i = 0; i < this.bodies.length; i++) {
        //buscamos dentro de cada uno de los objetos si alguno es el jugador
        if(this.bodies[i] instanceof Player){
          //si encontramos el jugador, avisamos que aún está vivo
          isPlayerAlive = true;
        }
        //buscamos tambien si hay algún invader vivo
        else if(this.bodies[i] instanceof Invader){
          //si hay alguno vivo avisamos que está vivo
          areInvadersAlive = true;
        }
        //actualizamos la posición del objeto
        this.bodies[i].update();
      }
      //si el jugador ya no está vivo
      if(!isPlayerAlive || !areInvadersAlive){
        this.gameOver();
      }
    },
    //definimos la funcion draw de Game
    draw: function(screen, gameSize) {
      //primero tenemos que limpiar nuestra pantalla
      //para que no se queden los ecos del pasado </3
      screen.clearRect(0,0,gameSize.x,gameSize.y);
      //esta funcion va a iterar dentro del array de objeto
      //y va a dibujar uno por uno
      for (var i = 0; i < this.bodies.length; i++) {
        //llamamos la funcion para dibujar y le pasamos
        //cada uno de los objetos
        drawRect(screen, this.bodies[i]);
      }
    },
    //definimos una función para agregar objetos al juego
    addBody: function(body){
      //empujamos dentro del array el nuevo objeto que recibimos
      this.bodies.push(body);
    },
    removeBody: function(body){
      //sacamos del array los objetos que ya no vamos a usar
      this.bodies.pop(body);
    },
    //creamos una función para checar cuando un invader está encima de otro
    invadersBelow: function(invader){
      //regresa si
      return this.bodies.filter(function(b){
        //el objeto b es un invader y...
        //la posicion y de b es mayor a la del invader y...
        //la distancia en x de b y el invader es menor al tamaño de un invader
        //eso significa que el invader tiene otro invader abajo
        return b instanceof Invader &&
               b.center.y > invader.center.y &&
               b.center.x - invader.center.x < invader.size.x &&
               invader.center.x - b.center.x < invader.size.x;
      }).length > 0;
    },
    //creamos una función para terminar con el juego
    gameOver: function(){
      //avisamos que se acabó
      console.log('game over');
      //dejamos de correr el juego
      this.runGame = false;
      showButtons("Game Over");
      document.getElementById('start').onclick = function(){
        new Game("screen", true);
      };
    }
  };

  //definimos una funcion Player para el comportamiento
  //del objeto tipo Player
  //va a tener dentro todas las propiedades y funciones
  var Player = function(game, gameSize){
    //definimos el juego al que pertenece
    this.game = game;
    //definimos el tamaño del objeto
    this.size = { x: 15, y: 15};
    //declaramos la posición del objeto
    //aparecerá en el centro/abajo de la pantalla
    this.center = { x:gameSize.x / 2, y: gameSize.y - this.size.x};
    //instanciamos el keyboarder
    this.keyboarder = new Keyboarder();
    //declaramos si el jugador disparó recientemente
    this.recentBullet = false;
  };

  Player.prototype = {
    //como vamos a actualizar la posición del player
    update: function() {
      //si la tecla izquierda es oprimida
      if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
        //si el juador no está al borde izquierdo de la pantalla
        if(this.center.x - this.size.x / 2 > 30){
          //nos movemos a la izquierda
          this.center.x -= 2;
        }
        //si la tecla derecha es oprimida
      } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
        if(this.center.x + this.size.x / 2 < 280){
          //nos movemos a la derecha
          this.center.x += 2;
        }
      }

      //si la tecla espacio es oprimida
      if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE) && this.recentBullet === false) {
        //instanciamos una nueva bala
        //el primer parametro es la posición de donde saldrá la bala
        //y el segundo es la velocidad que tendrá
        var bullet = new Bullet(
          //la bala sale del centro horizontal del playe
          //pero de su borde superior para que no se pegue él mismo
          { x: this.center.x, y: this.center.y - this.size.x / 2},
          //y la velocidad en x es 0 porque no se movera horizontalmente
          //pero en y se movera -6 pixeles por segundo
          { x: 0, y: -6});
        //añadimos la bala al array de objetos del juego
        this.game.addBody(bullet);
        //le avisamos al juego que el jugador disparó
        this.recentBullet = true;
        //ponemos en cooldown el disparo por 200ms
        setTimeout(function() {this.recentBullet = false;}.bind(this), 500);
      }
    }
  };

  //definimos las propiedades del invader
  var Invader = function(game, center, type){
    //definimos el juego al que pertenece
    this.game = game;
    //definimos el tamaño del objeto
    this.size = { x: 15, y: 15};
    //declaramos la posición del objeto
    this.center = center;
    //definimos el tipo de invader que será
    this.type = type;
    //declaramos si el movimiento será en X
    this.patrolX = 0;
    //definimos el sentido del movimiento
    //positivo es a la derecha
    //negativo es la izquierda
    this.speedX = 0.3;
  };
  //definimos los métodos que tendrá el invader
  Invader.prototype = {
    //como vamos a actualizar la posición del invader
    update: function() {
      //los invaders solo se mueven entre 40 pixeles
      //si el invader ya se movio lo que se podia mover
        if(this.patrolX < 0 || this.patrolX > 40) {
          //invertimos el movimiento para que regrese
          this.speedX = -this.speedX;
          //acercamos los invaders a los jugadores
          this.center.y = this.center.y + 2;
        }
      //cada tick el invader se va a mover dependiendo su velocidad
      this.center.x += this.speedX;
      //y su contador de movimiento empieza a retroceder
      this.patrolX += this.speedX;

      //randomizamos los disparos de los invaders
      //y nos aseguramos que el invader no le dispare a otros invaders
      if (Math.random() > 0.990 && !this.game.invadersBelow(this)) {
        //instanciamos una nueva bala
        //el primer parametro es la posición de donde saldrá la bala
        //y el segundo es la velocidad que tendrá
        var bulletType;
        if(this.type === 2){
          bulletType = { x:Math.random(), y: 2 };
        }else if(this.type === 3){
          bulletType = { x:Math.random(), y: 4 };
        }else{
          bulletType = { x:0, y: 2 };
        }
        var bullet = new Bullet(
          //la bala sale del centro horizontal del invader
          //pero de su borde inferior para que no se pegue él mismo
          { x: this.center.x, y: this.center.y + this.size.x / 2},
          //y la velocidad en x es 0 porque no se movera horizontalmente
          //pero en y se movera 2 pixeles por segundo
          bulletType);
        //añadimos la bala al array de objetos del juego
        this.game.addBody(bullet);
        }
      }
  };

  //creamos un método para poblar el juego de enemigos
  var createInvaders = function(game){
    //hacemos un arreglo donde los vamos a guardar
    var invaders = [];
    //ahora creamos 24 enemigos
    //Tres filas de 8
    for (var i = 0; i < 24; i++) {
      //la posicion del primer invader empezará en el pixel 30
      //y tendrán 30 pixeles de separación entre si
      var x = 30 + (i % 8) * 30;
      var y = 30 + (i % 3) * 30;
      //metemos cada invader creado dentro del array
      invaders.push(new Invader(game, {x: x, y: y }, Math.ceil(Math.random() * 3)));
    }
    //y regresamos el array ya poblado
    return invaders;
  }

  //declaramos las propiedades y métodos del objeto bullet
  //este objeto recibe su centro para la posición y su velocidad
  var Bullet = function(center, velocity){
    //definimos el tamaño del objeto
    this.size = { x: 3, y: 3};
    //declaramos la posición del objeto
    this.center = center;
    //declaramos la velocidad del objeto
    this.velocity = velocity;
  };

  Bullet.prototype = {
    //como vamos a actualizar la posición de la bala
    update: function() {
        //vamos a tomar la posicion actual de la bala
        //y le sumamos su velicocidad en cada eje
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y;
      }
  };

  //definimos una funcion para dibujar los cuerpos como un rectangulo
  //le pasamos la pantalla y el cuerpo a dibujar
  var drawRect = function(screen, body) {
    var bodycolor;
    if(body.type == 1){
      color = "#111";
    }else if(body.type == 2){
      color = "#800";
    }else if(body.type == 3){
      color = "#F00";
    }else {
      color = "#111";
    }
    screen.fillStyle = color || '#111';
    //los objetos tienen un centro y un tamaño
    //entonces se tienen que dibujar desde su centro
    screen.fillRect(body.center.x - body.size.x / 2,
                    body.center.y - body.size.y / 2,
                    body.size.x, body.size.y)
  };

  //creamos una funcion para leer los inputs del usuario
  var Keyboarder = function() {
    //vamos a guardar el estado de la tecla
    var keyState = {};
    //cuando oprimimos una tecla
    window.onkeydown = function(e) {
      //definimos que el estado es true
      keyState[e.keyCode] = true;
    };
    //cuando soltamos la tecla
    window.onkeyup = function(e) {
      //definimos que su estado es false
      keyState[e.keyCode] = false;
    };

    //definimos una funcion para saber si la tecla está oprimida
    this.isDown = function(keyCode) {
      //regresamos el estado de la tecla
      return keyState[keyCode] === true;
    };

    //definimos los keyCodes en lenguaje humano
    this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32, SPACE: 38 };

  };

  //definimos una función para calcular colisiones
  var colliding = function(b1, b2) {
    //esta función checa si los objetos colisionan
    //si ninguna de las condiciones es verdadera
    //entonces no colisionan
    //y regresa true siempre que no colisionen
    //¿cuando los objetos no colisionan?
    return !(
      //cuando los objetos no son el mismo
      b1 === b2 ||
      //cuando ambos objetos no son balas
      (b1 instanceof Bullet && b2 instanceof Bullet) ||
      //o si el borde derecho del objeto 1
      //no se encima con el borde izquierdo del obejto 2
      b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
      //o si el borde superior del objeto 1
      //no se encima con el borde inferior del objeto 2
      b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
      //o si el borde izquierdo del objeto 1
      //no se encima con el borde derecho del objeto 2
      b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
      //o si el borde inferior del objeto 1
      //no se encima con el borde superior del objeto 2
      b1.center.y - b1.size.x / 2 > b2.center.y + b2.size.y / 2
    );
  };

  //creamos una funcion para saber si los objetos aún están en pantalla
  //¿cuando un objeto no ha salido de la pantalla?
  var offScreen = function(b1) {
    return !(
      //si el borde izquierdo del objeto
      //no ha salido del borde izquierdo de la ventana
      b1.center.x - b1.size.x / 2 < 0 ||
      //o si el borde derecho del objeto
      //no ha salido del borde derecho de la ventana
      b1.center.x + b1.size.x / 2 > 310 ||
      //o si el borde superior del objeto
      //no ha salido del borde superior de la ventana
      b1.center.y + b1.size.y / 2 < 0 ||
      //o si el borde inferior del objeto
      //no ha salido del borde inferior de la ventana
      b1.center.y - b1.size.y / 2 > 310
    );
  }

  var clearScreen = function(){
    //borramos todos los mensajes encima del canvas
    document.getElementById('buttons').style.display = "none";
  }

  var showButtons = function(message){
    //mostramos la pantalla
    document.getElementById('message').innerHTML = message;
    document.getElementById('buttons').style.display = "initial";
  }

    //cuando el dom esté listo instanciamos Game
    window.onload = function() {
      showButtons("Welcome");
      new Game("screen");
    };
