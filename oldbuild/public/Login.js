// JavaScript Document

async function onSignIn(googleUser) {
  console.log(googleUser);
    var token = googleUser.credential; 
    var id = await googleUser.getAuthResponse().id_token;
    
    
    //window.open(window.location.href + "MainMenu:" + token, "_self");

    /*
    window.addEventListener( "pageshow", (e) => {
      if (e.persisted || (typeof window.performance != "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
      }
    });
    */
}

