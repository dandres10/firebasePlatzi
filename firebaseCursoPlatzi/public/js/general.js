$(() => {
  $('.tooltipped').tooltip({ delay: 50 })
  $('.modal').modal()

  // TODO: Adicionar el service worker

  // Init Firebase nuevamente
  firebase.initializeApp(varConfig);

  // Se registra el service worker
  navigator.serviceWorker
    .register('notificaciones-sw.js')
    .then(registro => {
      console.log('service worker registrado')
      firebase.messaging().useServiceWorker(registro)
    })
    .catch(error => {
      console.error(`Error al registrar el service worker => ${error}`)
    })

  // TODO: Registrar LLave publica de messaging

  const messaging = firebase.messaging()
  messaging.usePublicVapidKey(
    'BGuL9CDD3dAjWuxueC_OXKvYHFRRjSRo47r_2d07wdeTj0Ov3DZ2rd3HWETsAXZ4E_l0FIWeHExiR1GaaclvXKg'
  )

  // TODO: Solicitar permisos para las notificaciones

  messaging
    .requestPermission()
    .then(() => {
      console.log('permiso otorgado')
      return messaging.getToken()
    })
    .then(token => {
      console.log('token')
      console.log(token)
      const db = firebase.firestore()
      //db.settings({ timestampsInSnapshots: true }) ya no es necesario inicializarlo 
      db
        .collection('tokens')
        .doc(token)
        .set({
          token: token
        })
        .catch(error => {
          console.error(`Error al insertar el token en la BD => ${error}`)
        })
    })
    .catch(error => {
      console.error(`Permiso no otorgado => ${error}`)
    })


  // Obtener el token cuando se refresca
  messaging.onTokenRefresh(() => {
    messaging.getToken().then(token => {
      console.log('token se ha renovado')
      const db = firebase.firestore()
      db.settings({ timestampsInSnapshots: true })
      db
        .collection('tokens')
        .doc(token)
        .set({
          token: token
        })
        .catch(error => {
          console.error(`Error al insertar el token en la BD => ${error}`)
        })
    })
  })

  // TODO: Recibir las notificaciones cuando el usuario esta foreground

  messaging.onMessage(playload => {
    Materialize.toast(`Ya tenemos un nuevo post. Revisalo, se llama ${playload.data.titulo}`,
      6000)
  })

  // TODO: Recibir las notificaciones cuando el usuario esta background

  const post = new Post();
  post.consultarTodosPost()

  // TODO: Firebase observador del cambio de estado
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      $('#btnInicioSesion').text('Salir')
      if (user.photoURL) {
        $('#avatar').attr('src', user.photoURL)
      } else {
        $('#avatar').attr('src', 'imagenes/usuario.png')
      }
    } else {
      $('#btnInicioSesion').text('Iniciar Sesión')
      $('#avatar').attr('src', 'imagenes/usuario.png')
    }
  })


  // TODO: Evento boton inicio sesion
  $('#btnInicioSesion').click(() => {
    const user = firebase.auth().currentUser
    if (user) {
      $('#btnInicioSesion').text('Iniciar Sesion')
      return firebase.auth().signOut().then(() => {
        $('#avatar').attr('src', 'imagenes/usuario.png')
        Materialize.toast(`Sing out correcto`, 4000)
      }).catch(error => {
        Materialize.toast(`Error al realizar SingOut => ${error}`, 4000)
      })
    }



    $('#emailSesion').val('')
    $('#passwordSesion').val('')
    $('#modalSesion').modal('open')
  })

  $('#avatar').click(() => {
    firebase.auth().signOut()
      .then(() => {
        $('#avatar').attr('src', 'imagenes/usuario.png')
        Materialize.toast(`SignOut correcto`, 4000)
      })
      .catch(error => {
        Materialize.toast(`Error al realizar SignOut ${error}`, 4000)
      })
  })

  $('#btnTodoPost').click(() => {
    $('#tituloPost').text('Posts de la Comunidad')
    const post = new Post();
    post.consultarTodosPost()
  })

  $('#btnMisPost').click(() => {
    const user = firebase.auth().currentUser
    if (user) {
      const post = new Post()
      post.consultarPostxUsuario(user.email)
      $('#tituloPost').text('Mis Posts')
    } else {
      Materialize.toast(`Debes estar autenticado para ver tus posts`, 4000)
    }
  })
})
