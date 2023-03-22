// JavaScript Document
console.log(window.location.href);


window.onload = async () => {
    window.addEventListener( "pageshow", (e) => {
      if (e.persisted || (typeof window.performance != "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
      }
    });
    var body = await getKey();
    let currentMap;
    document.getElementById("New").href = window.location.href + "/editor:????????????????????????????????";
    for(let i = 0; i < body.maps.length; i++){
        var option = document.createElement("a"), wrapper = document.createElement("div"), deleteButton = document.createElement("div");
        
        wrapper.classList = "Wrapper";
        option.innerHTML = "Map " + (i+1) + ": " + body.maps[i].name;
        option.href = window.location.href + "/editor:" + body.maps[i].id;
        option.addEventListener("click", () => {
            document.getElementById("Overlay").style.opacity = "1";
            setTimeout(() => {
                window.open(window.location.href + "editor:" + body.maps[i].id,"_self");
            }, 1000);
        });
        deleteButton.classList = "DeleteButton";
        deleteButton.addEventListener("click", async (e) => {
            currentMap = Array.prototype.indexOf.call(e.target.parentElement.parentElement.children, e.target.parentElement);
            deleteMap(body.maps[currentMap].id);
            e.target.parentElement.remove();
        });
        wrapper.append(option);
        wrapper.append(deleteButton);
        document.getElementById("choice").append(wrapper);
    }   
}

async function getKey(){
    var response = await fetch(window.location.href.split("/")[0] + "getKey", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    });
  return response.json();
}

async function deleteMap(mapID){
    console.log(mapID);
    var response = await fetch(window.location.href.split("/")[0] + "deleteMap:" + mapID, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
    });
}

