// JavaScript Document

var mouseRow = -1, map, selectedNode = null, selectedRow = null, selectedComment = null, overNode, reader, currentURL = window.location.href.split("editor:")[0], sessions = [], selectedSession = -1, currentUser = null, newUnsavedComment = null;


class MapSave {
    constructor(elmnt){
        this.id = null;
        this.elmnt = elmnt;
        this.name = "Untitled";
        this.rows = [];
        this.commentSessions = [];
    }
    
    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
       }
       this.id = result;
    }
    
    fixIndexes() {
        var tempRow;
        
        for(var i = 0; i < this.rows.length; i++){
            this.rows[i].index = Array.prototype.indexOf.call(this.elmnt.children, this.rows[i].elmnt);
        }
        
        for(var i = 0; i < this.rows.length; i++){
            for(var j = 0; j < i; j++){
                if(this.rows[i].index < this.rows[j].index){
                    tempRow = this.rows[i];
                    this.rows[i] = this.rows[j];
                    this.rows[j] = tempRow;
                }
            }
        }
    }
    
    export() {
        
        function JSONEscaper(inputString){
            return inputString.split('<br>').join('\r\n');
        }
        
        var body = {
            "id": map.id,
            "name": this.name, 
            "rows": [],
            "commentSessions": []
        }
        
        for(let i = 0; i < this.commentSessions.length; i++){
            body.commentSessions.push({
                "date": this.commentSessions[i].date,
                "comments": []
            });
            for(let j = 0; j < this.commentSessions[i].comments.length; j++){
                body.commentSession.comments.push({
                    "message": this.commentSession.comments[j].message,
                    "user": this.commentSession.comments[j].user,
                    "location": [this.commentSession.comments[j].location[0], this.commentSession.comments[j].location[1]]
                });   
            }
        }
        
        for(let i = 0; i < this.rows.length; i++) {
            body.rows.push({
                "name": this.rows[i].name,
                "index": this.rows[i].index, 
                "nodes":[]
            });
            for(let j = 0; j < this.rows[i].nodes.length; j++) {
                var nodeTemp = this.rows[i].nodes[j];
                body.rows[i].nodes.push({
                    "index": nodeTemp.index,
                    "title": nodeTemp.title, 
                    "date": nodeTemp.date,
                    "location": nodeTemp.location,
                    "description": nodeTemp.description,
                    "content":[]
                });
                for(let k = 0; k < this.rows[i].nodes[j].content.length; k++) {
                    body.rows[i].nodes[j].content.push(this.rows[i].nodes[j].content[k]);
                }
            }
        }
        return JSON.stringify(body);
    }
}

class RowSave {
    constructor(elmnt){
        this.nodes = [];
        this.elmnt = elmnt;
        this.name = elmnt.children[1].innerHTML;
        this.index;
    }
    
    fixIndexes() {
        var tempNode;
        
        for(var i = 0; i < this.nodes.length; i++){
            this.nodes[i].index = Array.prototype.indexOf.call(this.elmnt.children, this.nodes[i].elmnt)-2;
        }
        
        for(var i = 0; i < this.nodes.length; i++){
            for(var j = 0; j < i; j++){
                if(this.nodes[i].index < this.nodes[j].index){
                    tempNode = this.nodes[i];
                    this.nodes[i] = this.nodes[j];
                    this.nodes[j] = tempNode;
                }
            }
        }
    }
}

class NodeSave {
    constructor(elmnt){
        this.elmnt = elmnt;
        this.index;
        this.title = "";
        this.date = "";
        this.location = "";
        this.description = "";
        this.content = [];
        this.textPassage = "";
    }
}

class SessionSave {
    constructor(id){
        this.mapID = id.substring(0,32),
        this.date = id.substring(33),
        this.id = id;
        this.replyLength = 0;
        this.replies = [];
        this.inMemory = false;
    }
    
    export() {
        var exportObject = {
            'mapID': this.mapID,
            'date': this.date,
            'id': this.id,
            'replyLength': this.replyLength,
            'replies': []
        }
        for(var i = 0; i < this.replies.length; i++){
            exportObject.replies.push(this.replies[i].export());
        }
        return exportObject;
    }
}

class CommentSave {
    constructor(session, user, message, position, id, replyLength, isSaved, replyTo, elmnt) {
        this.session = session;
        this.user = user;
        this.message = message;
        this.position = position;
        this.id = id;
        this.replyLength = replyLength;
        this.replies = [];
        this.isSaved = isSaved;
        this.replyTo = replyTo;
        this.elmnt = elmnt;
    }
    
    save() {
        if(this.isSaved == false) {
            this.isSaved = true;
            if(this.replyTo != null){
                uploadComment({
                    'session': this.session,
                    'user': this.user,
                    'message': this.message,
                    'position': this.position,
                    'replyTo': this.replyTo.id
                }); 
            } else {
                uploadComment({
                    'session': this.session,
                    'user': this.user,
                    'message': this.message,
                    'position': this.position,
                    'replyTo': null
                }); 
            }  
        }
        closeNodeMenu();
        setTimeout(() => {
            inspectComment(this);    
        }, 250);
    }
    
    export() {
        var exportObject = {
            'session': this.session,
            'user': this.user,
            'message': this.message,
            'position': this.position,
            'id': this.id,
            'replyLength': this.replyLength,
            'replies': []
        };
        for(var i = 0; i < this.replies.length; i++){
            exportObject.replies.push(this.replies[i].export());
        }
        return exportObject;
    }
}


window.onload = boot();


async function boot() {
    map = new MapSave(document.getElementById("Map"));
    var ID = window.location.href.split("editor:")[1];
    if(ID != "????????????????????????????????") {
        var response = await getMap(ID);
        loadMap(response);
        response = await getSessions(ID);
        if(response.current[0] != undefined){
            sessions.push(new SessionSave(response.current[0]));
            for(let i = 0; i < response.previous.length; i++){
                sessions.push(new SessionSave(response.previous[i]));
            }
            for(let i = 0; i < sessions.length; i++){
                var sessionOption = document.createElement("div");
                sessionOption.classList.add("DateChoice");
                sessionOption.innerHTML = sessions[i].date;
                sessionOption.addEventListener("mousedown", (e) => {
                    switchSession(i);
                });
                document.getElementById("DateScroller").append(sessionOption);
            }
            switchSession(0);
        }
    } else {
        map.makeid(32);
        addRow();
    }
    reader = new FileReader();
    reader.onloadend = async () => {
        if(document.getElementById("Upload").files[0].size < 9000000){
            var URL = await uploadContent(reader.result, document.getElementById("Upload").files[0].name, document.getElementById("Upload").files[0].type, selectedNode);
            addContent(URL);
        }
    }
    console.log(selectedSession);
    //currentUser = await getUsername(window.location.href.split("MainMenu:")[1].split("/editor:")[0]);
    initializeEvents();
    refreshComments();
}

function loadMap(mapLoad){
    map.id = mapLoad.id;
    if(mapLoad.name == null){
        map.name = "Untitled"
    } else {
        map.name = mapLoad.name;
    }
    document.getElementById("MapName").innerHTML = map.name;
    for(let i = 0; i < mapLoad.rows.length; i++) {
        addRow();
        map.rows[i].elmnt.children[1].innerHTML = mapLoad.rows[i].name;
        map.rows[i].name = mapLoad.rows[i].name;
        map.rows[i].index = mapLoad.rows[i].index;
        for(let j = 0; j < mapLoad.rows[i].nodes.length; j++) {
            var tempNode = addNode(i);
            tempNode.index = mapLoad.rows[i].nodes[j].index;
            tempNode.title = mapLoad.rows[i].nodes[j].title;
            tempNode.date = mapLoad.rows[i].nodes[j].date;
            tempNode.location = mapLoad.rows[i].nodes[j].location;
            tempNode.description = mapLoad.rows[i].nodes[j].description;
            for(let k = 0; k < mapLoad.rows[i].nodes[j].content.length; k++){
                tempNode.content.push(mapLoad.rows[i].nodes[j].content[k]);
            }
            tempNode.elmnt.style.backgroundImage = "url(" + tempNode.content[0] + ")";
        }
    }
}

function loadComments(sessionLoad, session){
    var newComment = new CommentSave(sessionLoad.session, sessionLoad.user, sessionLoad.message, sessionLoad.position, sessionLoad.id, sessionLoad.replyLength, true);
    session.replies.push(newComment);
    if(newComment.id.split("-").length <= 1){
        addComment(newComment.position[0], newComment.position[1], newComment);
    }
    for(let i = 0; i < sessionLoad.replies.length; i++){
        loadComments(sessionLoad.replies[i], newComment);
    }
}

async function switchSession(index){
    if(selectedSession != index){
        selectedSession = index;
        for(let i = 0; i < document.getElementById("CommentWrapper").children.length; i){
            document.getElementById("CommentWrapper").children[i].remove();
        }
        if(!sessions[index].inMemory){
            var comments = await getComments(sessions[index].id);
            for(let i = 0; i < comments.replies.length; i++){
                loadComments(comments.replies[i], sessions[index]);
            }
            sessions[index].inMemory = true;
        } else {
            for(let i = 0; i < sessions[index].replies.length; i++){
                addComment(sessions[index].replies[i].position[0], sessions[index].replies[i].position[1], sessions[index].replies[i]);
            }
        }
        var choices = document.getElementById("DateScroller").children;
        for(let i = 0; i < choices.length; i++){
            if(i == index){
                choices[i].style.backgroundColor = "rgba(255,255,255, 1)";
                choices[i].style.color = "red";
            } else {
                choices[i].style.backgroundColor = "rgba(255,255,255, 0)";
                choices[i].style.color = "white";
            }
        }
    }
}

function initializeEvents(){
    window.addEventListener( "pageshow", (e) => {
      if (e.persisted || (typeof window.performance != "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
      }
    });
    document.getElementById("CommentOptionButtons").children[0].addEventListener("mousedown", (e) => {
        if(!selectedComment.isSaved){
            setTimeout(() => {
                selectedComment.save();
            }, 100)
        }
    });
    document.getElementById("CommentOptionButtons").children[1].addEventListener("mousedown", (e) => {
        closeNodeMenu();
    });
    document.getElementById("NotificationChoices").children[0].addEventListener("mousedown", (e) => {
        closeNotification();
    });
    document.getElementById("CommentSessionButton").addEventListener("mousedown", (e) => {
        popupNotification("Are you sure you want to start a new comment session? The previous session will become view-only.", startNewSession);
    });
    document.getElementById("NodeButton").addEventListener("mousedown", (e) => {
		nodeButton(document.getElementById("NodePointer"), e);
	});
	document.getElementById("RowButton").addEventListener("mousedown", (e) => {
		nodeButton(document.getElementById("RowPointer"), e);
	});
    document.getElementById("CommentButton").addEventListener("mousedown", (e) => {
		nodeButton(document.getElementById("CommentPointer"), e);
	});
	document.getElementById("Toolbar").addEventListener("mouseover", (e) => {
		mouseRow = -2;
	});
    document.getElementById("Toolbar").addEventListener("mouseout", (e) => {
		mouseRow = -1;
	});
    document.getElementById("MainWrapper").addEventListener("mousedown", (e) => {
        if(document.getElementById("NodeMenu").style.width = "34%" && mouseRow != -2 && !overNode) {
            closeNodeMenu();
        }
    });
    document.getElementById("MapName").addEventListener("click", (e) => {
        if(e.target.innerHTML == "Enter Map Name..."){
            entryField(e.target);
        } 
    });
    document.getElementById("MapName").addEventListener("focusout", (e) => {
            map.name = e.target.innerHTML;
    });
    document.getElementById("MapName").addEventListener("keydown", (e) => {
        if(e.keyCode == 13){
            e.preventDefault();
        }
    });
    document.getElementById("TitlePreview").addEventListener("click", (e) => {
        if(e.target.innerHTML == "Enter Title..."){
            entryField(e.target);
        } 
    });
    document.getElementById("TitlePreview").addEventListener("focusout", (e) => {
        if(e.target.innerHTML != "Enter Title..." && e.target.innerHTML.length > 0){
            e.target.style.borderColor = "blue";
        } else if(e.target.innerHTML.length == 0) {
            e.target.style.borderColor = "";
            e.target.innerHTML = "Enter Title...";
        }
        selectedNode.title = e.target.innerHTML;
    });
    document.getElementById("TitlePreview").addEventListener("keydown", (e) => {
        if(e.keyCode == 13){
            e.preventDefault();
        }
    });
    document.getElementById("DatePreview").addEventListener("click", (e) => {
        if(e.target.innerHTML == "##/##/####"){
            entryField(e.target);
        }
    });
    document.getElementById("DatePreview").addEventListener("keydown", (e) => {
        if(e.keyCode == 13){
            e.preventDefault();
        }
    });
    document.getElementById("DatePreview").addEventListener("focusout", (e) => {
        if(e.target.innerHTML != "##/##/####" && e.target.innerHTML.length > 0){
            e.target.style.borderColor = "blue";
        } else if(e.target.innerHTML.length == 0) {
            e.target.style.borderColor = "";
            e.target.innerHTML = "##/##/####";
        }
        selectedNode.date = e.target.innerHTML;
    });
    document.getElementById("LocationPreview").addEventListener("click", (e) => {
        if(e.target.innerHTML == "Enter Location..."){
            entryField(e.target);
        }
    });
    document.getElementById("LocationPreview").addEventListener("keydown", (e) => {
        if(e.keyCode == 13){
            e.preventDefault();
        }
    });
    document.getElementById("LocationPreview").addEventListener("focusout", (e) => {
        if(e.target.innerHTML != "Enter Location..." && e.target.innerHTML.length > 0){
            e.target.style.borderColor = "blue";
        } else if(e.target.innerHTML.length == 0) {
            e.target.style.borderColor = "";
            e.target.innerHTML = "Enter Location...";
        }
        selectedNode.location = e.target.innerHTML;
    });
    document.getElementById("DescriptionPreview").addEventListener("click", (e) => {
        if(e.target.innerHTML == "Enter Description..."){
            entryField(e.target);
        }
    });
    document.getElementById("DescriptionPreview").addEventListener("focusout", (e) => {
        if(e.target.innerHTML != "Enter Description..." && e.target.innerHTML.length > 0){
            e.target.style.borderColor = "blue";
        } else if(e.target.innerHTML.legnth == 0) {
            e.target.style.borderColor = "";
            e.target.innerHTML = "Enter Description...";
        }
        if(selectedNode != null){
            selectedNode.description = JSON.stringify(e.target.innerHTML);
        }
    });
    document.getElementById("AddContent").addEventListener("click", (e) => {
        document.getElementById("Upload").click();
    });
    document.getElementById("Upload").addEventListener("change", (e) => {
        reader.readAsDataURL(e.target.files[0]);
    });
    document.getElementById("ContentPreviewScroller").addEventListener("scroll", (e) =>{
        var scrollPercent = Math.round(e.target.scrollTop/e.target.clientHeight);
        document.getElementById("ContentPreviewOptionWrapper").children[scrollPercent].style.backgroundColor = "blue";
        if(scrollPercent > 0){
            document.getElementById("ContentPreviewOptionWrapper").children[scrollPercent-1].style.backgroundColor = "";
        }
        if(scrollPercent < document.getElementById("ContentPreviewOptionWrapper").children.length-1){
            document.getElementById("ContentPreviewOptionWrapper").children[scrollPercent+1].style.backgroundColor = "";
        }
    });
    document.getElementById("Save").addEventListener("click", () => {
        save();
    });
    document.getElementById("NodeDelete").addEventListener("click", () => {
        removeNode();
    });
    addOption();
}

function addRow(mouseY) {
	var newRow = document.createElement("div"), position;
	var rowCount = document.getElementById("Map").children.length;
	var windowHeight = window.innerHeight - (window.innerHeight*0.075);
    var rowTitle = document.createElement("span"), rowOptions = document.createElement("div");
    var rowUp = document.createElement("div"), rowDown = document.createElement("div"), rowDelete = document.createElement("div");
    var rowUpSVG = document.getElementsByClassName("UpArrowSVG")[0].cloneNode(true);
    var rowDownSVG = document.getElementsByClassName("DownArrowSVG")[0].cloneNode(true);
    var rowDeleteSVG = document.getElementsByClassName("DeleteSVG")[0].cloneNode(true);
	
	document.getElementById("Map").style.height = document.getElementById("Map").clientHeight + (window.innerHeight/5) + "px";
    if(document.getElementById("Map").clientHeight > document.getElementById("MapWrapper").clientHeight){
        document.getElementById("Map").style.top = "0%";
        document.getElementById("Map").style.transform = "none";
    } else {
        document.getElementById("Map").style.top = "50%";
        document.getElementById("Map").style.transform = "translate(0,-50%)";
    }
    
    resizeCommentWrapper();
    		
	newRow.classList.add("MapRows");
	newRow.addEventListener("mouseover", () => {
		mouseRow = Array.prototype.indexOf.call(document.getElementById("Map").children, newRow);
	});
	newRow.addEventListener("mouseout", () => {
		mouseRow = -1;
	});
    rowTitle.classList.add("RowTitle");
    rowTitle.contentEditable = "true";
    rowTitle.innerHTML = "Enter Row Title...";
    rowTitle.addEventListener("click", (e) => {
        if(e.target.innerHTML == "Enter Row Title..."){
            entryField(rowTitle);
        }
    });
    rowTitle.addEventListener("keydown", (e) => {
        if(e.keyCode == 13){
            e.preventDefault();
        }
    });
    rowOptions.classList.add("RowOptions");
    newRow.append(rowOptions);
    newRow.append(rowTitle);
    var rowSave = new RowSave(newRow);
    rowTitle.addEventListener("focusout", (e) => {
        rowSave.name = e.target.innerHTML;
    });
    rowUp.classList.add("RowButton");
    rowUp.addEventListener("click", () => {
        if(Array.prototype.indexOf.call(document.getElementById("Map").children, newRow) > 0) {
           document.getElementById("Map").insertBefore(newRow, newRow.previousElementSibling);
            map.fixIndexes();
        }
    });
    rowDown.classList.add("RowButton");
    rowDown.addEventListener("click", () => {
        if(Array.prototype.indexOf.call(document.getElementById("Map").children, newRow) < document.getElementById("Map").children.length-1) {
           document.getElementById("Map").insertBefore(newRow, newRow.nextElementSibling.nextElementSibling);
            map.fixIndexes();
        }
    });
    rowDelete.classList.add("RowButton");
    rowDelete.addEventListener("click", () => {
        removeRow(rowSave);
    });
    
    rowDeleteSVG.classList.add("ButtonSVG");
    rowUpSVG.classList.add("ButtonSVG");
    rowDownSVG.classList.add("ButtonSVG");
    
    rowUp.append(rowUpSVG);
    rowDown.append(rowDownSVG);
    rowDelete.append(rowDeleteSVG);
    
    rowOptions.append(rowUp);
    rowOptions.append(rowDelete);
    rowOptions.append(rowDown);
	
    if(rowCount > 0){
        if(document.getElementById("MapWrapper").scrollHeight > window.innerHeight*0.925){
            position = Math.round(((mouseY + document.getElementById("MapWrapper").scrollTop - window.innerHeight*0.075)/document.getElementById("MapWrapper").scrollHeight) / (1/rowCount));
        } else {
            position = Math.round(((mouseY*1.075 - window.innerHeight*0.075)/window.innerHeight) / (1/rowCount));
        }
        document.getElementById("Map").insertBefore(newRow, document.getElementById("Map").children[position]);
    } else {
        document.getElementById("Map").insertBefore(newRow, null);
    }
    
    map.rows.push(rowSave);
    map.fixIndexes();
    
    setTimeout(() =>{
        newRow.style.width = "100%";
    }, 10);
    
}

function removeRow(row) {
	var windowHeight = window.innerHeight*0.925;
		
    row.elmnt.style.width = "0vh";
    setTimeout(() => {
        document.getElementById("Map").style.height = (0.2*window.innerHeight) * (document.getElementById("Map").children.length-1) + "px";
        if(document.getElementById("Map").clientHeight > document.getElementById("MapWrapper").clientHeight){
            document.getElementById("Map").style.top = "0%";
            document.getElementById("Map").style.transform = "none";
        } else {
            document.getElementById("Map").style.top = "50%";
            document.getElementById("Map").style.transform = "translate(0,-50%)";
        }
        for(var i = 0; i < row.nodes.length; i++){
            if(row.nodes[i] == selectedNode){
                closeNodeMenu();
            }
        }
        map.rows.splice(row.index, 1);
        row.elmnt.remove();
        map.fixIndexes();
        resizeCommentWrapper();
    }, 300);
}

function closeNodeMenu(){
    clearMapComment(newUnsavedComment);
    document.getElementById("MainWrapper").style.width = "100%";
    document.getElementById("NodeMenu").style.width = "0%";
    document.getElementById("DateDropdown").style.width = "18vw";
    if(selectedNode != null){
        selectedNode.title = document.getElementById("TitlePreview").innerHTML;
        selectedNode.date = document.getElementById("DatePreview").innerHTML;
        selectedNode.location = document.getElementById("LocationPreview").innerHTML;
        selectedNode.description = JSON.stringify(document.getElementById("DescriptionPreview").innerHTML);
    }
    selectedNode = null;
    selectedComment = null;
}

function inspectNode(node) {
    if(selectedNode != node){
        if(selectedRow != mouseRow){
            selectedRow = mouseRow;
        }
        selectedNode = node;
        selectedComment = null;
        
        document.getElementById("CommentPreview").style.opacity = "0";
        document.getElementById("NodePreview").style.pointerEvents = "all";
        document.getElementById("CommentPreview").style.pointerEvents = "none";
        
        if(document.getElementById("MainWrapper").clientWidth == window.innerWidth){
            document.getElementById("NodePreview").style.opacity = "1";
            document.getElementById("MainWrapper").style.width = "66%";
            document.getElementById("NodeMenu").style.width = "34%";
            document.getElementById("DateDropdown").style.width = "calc(18vw * 0.66)";
            removeContentPreview();
            checkInfo();
        } else {
            if(document.getElementById("NodePreview").style.opacity == "1"){
                document.getElementById("NodePreview").style.opacity = "0";
                setTimeout(() => {
                    removeContentPreview();
                    checkInfo();
                    document.getElementById("NodePreview").style.opacity = "1";
                }, 150);
            } else {
                document.getElementById("MainWrapper").style.width = "100%";
                document.getElementById("NodeMenu").style.width = "0%";
                setTimeout(() => {
                    removeContentPreview();
                    document.getElementById("DateDropdown").style.width = "calc(18vw * 0.66)";
                    document.getElementById("NodePreview").style.opacity = "1";
                    checkInfo();
                    document.getElementById("MainWrapper").style.width = "66%";
                    document.getElementById("NodeMenu").style.width = "34%";
                }, 250);   
            }
        }
    }
    
    function checkInfo(){
        if(node.title != ""){
            document.getElementById("TitlePreview").innerHTML = node.title;
            document.getElementById("TitlePreview").style.borderColor = "blue";
        } else {
            document.getElementById("TitlePreview").innerHTML = "Enter Title...";
            document.getElementById("TitlePreview").style.borderColor = "";
        }
        if(node.date != ""){
            document.getElementById("DatePreview").innerHTML = node.date;
            document.getElementById("DatePreview").style.borderColor = "blue";
        } else {
            document.getElementById("DatePreview").innerHTML = "##/##/####";
            document.getElementById("DatePreview").style.borderColor = "";
        }
        if(node.location != ""){
            document.getElementById("LocationPreview").innerHTML = node.location;
            document.getElementById("LocationPreview").style.borderColor = "blue";
        } else {
            document.getElementById("LocationPreview").innerHTML = "Enter Location...";
            document.getElementById("LocationPreview").style.borderColor = "";
        }
        if(node.description != ""){
            document.getElementById("DescriptionPreview").innerHTML = node.description.substring(1, node.description.length-1).split('\\"').join('"').split('\\\\').join('\\');
            document.getElementById("DescriptionPreview").style.borderColor = "blue";
        } else {
            document.getElementById("DescriptionPreview").innerHTML = "Enter Description...";
            document.getElementById("DescriptionPreview").style.borderColor = "";
        }
        readContent(node);
    }
}

function inspectComment(comment){
    if(selectedComment == null || selectedComment != comment){
        if(!comment.isSaved){
            newUnsavedComment = comment
        }
        selectedComment = comment;
        selectedNode = null;
        
        document.getElementById("NodePreview").style.opacity = "0";
        document.getElementById("NodePreview").style.pointerEvents = "none";
        document.getElementById("CommentPreview").style.pointerEvents = "all";
        if(comment.isSaved){
            document.getElementById("CommentOptionButtons").style.height = "0vh";
        } else {
            document.getElementById("CommentOptionButtons").style.height = "7.5vh";
        }
        
        if(document.getElementById("MainWrapper").clientWidth == window.innerWidth){
            switchInfo(comment);
            document.getElementById("MainWrapper").style.width = "66%";
            document.getElementById("NodeMenu").style.width = "34%";
            document.getElementById("DateDropdown").style.width = "calc(18vw * 0.66)";
            document.getElementById("CommentPreview").style.opacity = "1";
        } else {
            if(document.getElementById("CommentPreview").style.opacity == "1"){
                document.getElementById("CommentPreview").style.opacity = "0";
                setTimeout(() => {
                    switchInfo(comment);
                    if(comment != newUnsavedComment){
                        clearMapComment(newUnsavedComment);    
                    }
                    document.getElementById("CommentPreview").style.opacity = "1";
                }, 150);
            } else {
                document.getElementById("MainWrapper").style.width = "100%";
                document.getElementById("NodeMenu").style.width = "0%";
                setTimeout(() => {
                    switchInfo(comment);
                    document.getElementById("CommentPreview").style.opacity = "1";
                    document.getElementById("MainWrapper").style.width = "66%";
                    document.getElementById("NodeMenu").style.width = "34%";
                }, 250);
            }
        } 
    }
    
    function switchInfo(comment){
        var commentPreviews = document.getElementById("CommentPreview").children;
        for(let i = 1; i < document.getElementById("CommentPreview").children.length; i){
            commentPreviews[i].remove();
        }
        createPreview(comment);
    }
    
    function createPreview(commentPreview){
        if(commentPreview.replyTo != undefined){
            createPreview(commentPreview.replyTo);    
        }
        
        var newCommentWrapper = document.createElement("div"), newCommentArrow = document.getElementsByClassName("CommentArrowSVG")[0].cloneNode(true), newCommentPreview = document.createElement("div"), newCommentPreviewUsername = document.createElement("div"), newCommentPreviewMessage = document.createElement("div"), newReplyButton = document.createElement("div");
        
        newCommentWrapper.classList.add("CommentWrapper");
        newCommentArrow.classList.add("CommentArrow");
        newCommentWrapper.append(newCommentArrow);
        newCommentPreview.classList.add("Comment");
        if(commentPreview.replyTo != undefined){
            newCommentPreview.style.width = "75%";
            newCommentArrow.style.right = "75%";
        } else if(!commentPreview.isSaved){
            newCommentPreview.style.width = "100%";
        } else {
            if(document.getElementById("CommentPreview").children.length == 1){
                newCommentPreview.style.width = "100%";
            } else {
                newCommentPreview.style.width = "calc(" + (25*(5 - commentPreview.id.split("-").length)) + "% - 0.5vh)";
                if(100/(commentPreview.id.split("-").length) < 100){
                    newCommentArrow.style.right = (25*(5 - commentPreview.id.split("-").length)) + "%";    
                }
            }
        } 
        newCommentWrapper.append(newCommentPreview);
        newCommentPreviewUsername.classList.add("CommentUsername");
        newCommentPreviewUsername.innerHTML = commentPreview.user;
        newCommentPreviewMessage.classList.add("CommentMessage");
        if(!commentPreview.isSaved) {
            newCommentPreviewMessage.classList.add("CommentMessage");
            newCommentPreviewMessage.contentEditable = "true"; 
            newCommentPreviewMessage.addEventListener("click", (e) => {
                if(e.target.innerHTML == "Enter Message Here..."){
                    entryField(e.target);
                }
            });
        } else {
            newCommentPreviewMessage.classList.add("SavedCommentMessage");
            newReplyButton.classList.add("ReplyButton");
            newReplyButton.innerHTML = "Reply";
            newReplyButton.addEventListener("mousedown", () => {
                inspectComment(new CommentSave(sessions[selectedSession].id, currentUser, JSON.stringify("Enter Message Here..."), null, "-1", 0, false, commentPreview, null));
            });
            if(commentPreview.isSaved){
                newCommentPreviewUsername.append(newReplyButton);    
            }   
        }
        newCommentPreviewMessage.innerHTML = commentPreview.message;
        newCommentPreviewMessage.innerHTML = newCommentPreviewMessage.innerHTML.substring(1, newCommentPreviewMessage.innerHTML.length-1).split('\\"').join('"').split('\\\\').join('\\');
        newCommentPreviewMessage.addEventListener("focusout", (e) => {
            commentPreview.message = JSON.stringify(e.target.innerHTML);
        });
        newCommentPreview.append(newCommentPreviewUsername);
        newCommentPreview.append(newCommentPreviewMessage);
        if(commentPreview.replyTo != undefined && document.getElementById("CommentPreview").children.length > 2){
            document.getElementById("CommentPreview").insertBefore(newCommentWrapper, document.getElementById("CommentPreview").children[2]);
        } else {
            document.getElementById("CommentPreview").append(newCommentWrapper);
        }
        
        for(let i = 0; i < commentPreview.replies.length; i++){
            createPreview(commentPreview.replies[i]);
        }
    }
}

function nodeButton(elmnt, e) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		
	e = e || window.event;
	e.preventDefault();
	switch(elmnt.id){
		case "NodePointer":
			elmnt.style.height = "10vh";
			elmnt.style.width = "10vh";
			break;
		case "RowPointer":
			elmnt.style.width = "10vh";
			break;
        case "CommentPointer":
            elmnt.style.width = "5vh";
            elmnt.style.height = "5vh";
            break;
	}
    pos3 = e.clientX;
    pos4 = e.clientY;
	elmnt.style.top = pos4 + "px";
    elmnt.style.left = pos3 + "px";
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
	}
	
	function closeDragElement(e) {
		e = e || window.event;
		e.preventDefault();
		elmnt.style.width = "0vh";
		switch(elmnt.id){
			case "NodePointer":
				elmnt.style.height = "0vh";
                if(mouseRow >= 0){
				    inspectNode(addNode(mouseRow, e.clientX));
                }
				break;
			case "RowPointer":
                if(mouseRow >= -1){
				    addRow(e.clientY);
                }
				break;
            case "CommentPointer":
                elmnt.style.height = "0vh";
                if(mouseRow >= 0){
                    inspectComment(addComment((e.clientX / map.elmnt.clientWidth)*100, ((e.clientY + map.elmnt.scrollTop - map.elmnt.getBoundingClientRect().top) / map.elmnt.scrollHeight)*100));
                }
                break;
		}
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

function addComment(x, y, commentSave){
    x = Math.floor(x);
    y = Math.floor(y);
    var newComment = document.createElement("div"), newCommentSave;
    var newCommentPreview = document.createElement("div"), newCommentPreviewUsername = document.createElement("div"), newCommentPreviewMessage = document.createElement("div");
    newComment.classList.add("MapComment");
    newComment.addEventListener("mouseover", () => {
        overNode = true;
    });
    newComment.addEventListener("mouseout", () => {
        overNode = false;
    });
    document.getElementById("CommentWrapper").append(newComment);
    newComment.style.top = y + "%";
    newComment.style.left = x + "%";
    newComment.style.height = "5vh";
    newComment.style.width = "5vh";
    
    if(commentSave != undefined) {
        newComment.addEventListener("click", () => {
            inspectComment(commentSave);
        });
    } else {
        newCommentSave = new CommentSave(sessions[selectedSession].id, currentUser, JSON.stringify("Enter Message Here..."), [x,y], "-1", 0, false, null, newComment);
        newComment.addEventListener("click", () => {
            inspectComment(newCommentSave);
        }); 
    }
    return newCommentSave;
}

function clearMapComment(comment) {
    if(comment != null){
        if(comment.elmnt != null){
            newUnsavedComment = null;
            comment.elmnt.remove();    
        }    
    }
}

function addNode(i, mouseX) {
		var row = document.getElementById("Map").children[i];
		var newNode = document.createElement("div");
        var nodeSave = new NodeSave(newNode);

		newNode.classList.add("Node");
		newNode.addEventListener("click", () => {
			inspectNode(nodeSave);
		});
        newNode.addEventListener("mouseover", () => {
			overNode = true;
		});
        newNode.addEventListener("mouseout", () => {
			overNode = false;
		});
		newNode.style.backgroundColor = "rgb(" + (Math.random()*255) + ", " + (Math.random()*255) + ", " + (Math.random()*255) + ")";
		
		if(row.children.length > 2){
			var position = Math.round((mouseX/document.getElementById("Map").clientWidth) / (1/(row.children.length-2)));
                        
			if (position > row.children.length) {
				row.insertBefore(newNode, null);
			} else {
				row.insertBefore(newNode, row.children[position+2]);
			}
		} else {
			row.append(newNode);
		}
		
		setTimeout(() =>{
			newNode.style.width = "17vh";
			newNode.style.height = "17vh";
		}, 10);
        
        map.rows[i].nodes.push(nodeSave);
        map.rows[i].fixIndexes();
                
        return nodeSave;
}

function removeNode() {
    map.rows[selectedRow].nodes.splice(selectedNode.index, 1);
    selectedNode.elmnt.remove();
    closeNodeMenu();
}

function entryField(elmnt){
    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(elmnt);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(elmnt);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

async function addContent(file){
    var newSlide = document.createElement("img");
    var wrapper = document.getElementById("ContentPreviewWrapper");
    var gridTemplate = "";
    
    newSlide.src = file;
    newSlide.classList = "ContentPreview";
    wrapper.insertBefore(newSlide, wrapper.children[wrapper.children.length - 1]);
    for(var i = 0; i < wrapper.children.length; i++){
        gridTemplate += 100/wrapper.children.length + "% ";
    }
    wrapper.style.gridTemplateRows = gridTemplate;
    wrapper.style.height = wrapper.children.length*100 + "%";
    addOption();
    if(selectedNode.content.length == 1){
        selectedNode.elmnt.style.backgroundImage = "url(" + selectedNode.content[0] + ")";
        selectedNode.elmnt.style.backgroundColor = "";
    }
}

function readContent(node){
    var wrapper = document.getElementById("ContentPreviewWrapper");
    var gridTemplate = "";
    var length = document.getElementById("ContentPreviewOptionWrapper").children.length;
    
    for(var i = length-1; i > 0; i--){
        document.getElementById("ContentPreviewOptionWrapper").children[i].remove();
    }
    for(var i = 0; i < node.content.length; i++){
        var newSlide = document.createElement("img");
        newSlide.src = node.content[i];
        newSlide.classList = "ContentPreview";
        wrapper.insertBefore(newSlide, wrapper.children[wrapper.children.length - 1]);
        addOption();
    }
    for(var i = 0; i < wrapper.children.length; i++){
        gridTemplate += 100/wrapper.children.length + "% ";
    }
    wrapper.style.gridTemplateRows = gridTemplate;
    wrapper.style.height = wrapper.children.length*100 + "%";
    document.getElementById("ContentPreviewOptionWrapper").style.height = 5*document.getElementById("ContentPreviewOptionWrapper").children.length + "vh";
    document.getElementById("ContentPreviewOptionWrapper").children[0].style.backgroundColor = "blue";
    document.getElementById("ContentPreviewScroller").scrollTop = 0;
}

function addOption(){
    var option = document.createElement("div");

    document.getElementById("ContentPreviewOptionWrapper").append(option);
    document.getElementById("ContentPreviewOptionWrapper").style.height = 5*document.getElementById("ContentPreviewOptionWrapper").children.length + "vh";
    option.classList = "ContentPreviewOptions";
    option.addEventListener("click", () => {
        document.getElementById("ContentPreviewScroller").scrollTop = (document.getElementById("ContentPreviewWrapper").scrollHeight/document.getElementById("ContentPreviewOptionWrapper").children.length)*Array.prototype.indexOf.call(document.getElementById("ContentPreviewOptionWrapper").children, option);
    });
}

function removeContentPreview(){
    var wrapper = document.getElementById("ContentPreviewWrapper");
    var contentLength = wrapper.children.length - 1;
    
    for(let i = 0; i < contentLength; i++) {
        wrapper.children[0].remove();
    }
    wrapper.style.gridTemplateRows = "100%";
    wrapper.style.height = "100%";
}

function resizeCommentWrapper(){
    document.getElementById("CommentWrapper").style.height = document.getElementById("Map").style.height;
    document.getElementById("CommentWrapper").style.top = document.getElementById("Map").style.top;
    document.getElementById("CommentWrapper").style.transform = document.getElementById("Map").style.transform;
}

function popupNotification(message, confirmFunction){
    document.getElementById("NotificationWrapper").style.opacity = "1";
    document.getElementById("NotificationMessage").innerHTML = message;
    document.getElementById("NotificationWrapper").style.pointerEvents = "all";
    document.getElementById("NotificationWrapper").style.backgroundColor = "rgba(0,0,0, 0.3)";
    document.getElementById("NotificationWindow").style.width = "100vh";
    document.getElementById("NotificationChoices").children[1].onmousedown = confirmFunction;
}

function closeNotification(){
    document.getElementById("NotificationWrapper").style.backgroundColor = "rgba(0,0,0, 0)";
    document.getElementById("NotificationWindow").style.width = "0vh";
    setTimeout(() =>{
        document.getElementById("NotificationWrapper").style.opacity = "0";
        document.getElementById("NotificationWrapper").style.pointerEvents = "none";
        document.getElementById("NotificationMessage").innerHTML = "";
    }, 200);
}

function getSessionSave(id){
    for(let j = 0; j < sessions.length; j++){
        if(id == sessions[j].id){
            return sessions[j];
        }
    }
    return null;
}



async function uploadContent(file, name, type, node){
    var response = await fetch(currentURL + "uploadContent", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'file': file,
            'name': name,
            'type': type
        })
    });
    if(response){
        node.content.push('https://testmaterialsmatter.s3.us-east-2.amazonaws.com/Content/' + name);
        return 'https://testmaterialsmatter.s3.us-east-2.amazonaws.com/Content/' + name;
    }
}

async function save(){
    var mapExport = map.export();
    var response = await fetch(currentURL + "saveMap", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: mapExport
    });
}

async function getMap(mapID){
    var response = await fetch(currentURL + "getMap:" + mapID, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    });
  return response.json();
}

async function getSessions(id){
    var response = await fetch(currentURL + "getSessionKey:" + id, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    });
    return response.json();
}

async function getComments(id){
    var response = await fetch(currentURL + "getComments:" + id, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    });
    return await response.json();
}

async function getRefreshComments(id){
    var response = await fetch(currentURL + "getRefreshComments:" + id, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    });
    return await response.json();
}

async function startNewSession(){
    var response = await fetch(currentURL + "createSession:" + map.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: ''
    });
    response = await response.json();
    if(response.id != null){
        sessions.push(new SessionSave(response.id));
        var newIndex = sessions.length-1;
        selectedSession = newIndex; 
        var sessionOption = document.createElement("div");
        sessionOption.classList.add("DateChoice");
        sessionOption.innerHTML = sessions[newIndex].date;
        sessionOption.addEventListener("mousedown", (e) => {
            switchSession(newIndex);
        });
        document.getElementById("DateScroller").append(sessionOption);
        switchSession(newIndex);
    }
    closeNotification();
}

async function uploadComment(commentSave){
    var response = await fetch(currentURL + "addComment", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentSave)
    });
}

async function refreshComments(){
    var newComments = [];
    setTimeout(async () => {
        var newSession = await getRefreshComments(sessions[selectedSession].id);
        if(newSession.id != null){
            compareSessions(newSession, sessions[selectedSession]);
            for(let i = 0; i < newComments.length; i++){
                var location = newComments[i].id.split("-");
                loadComments(newComments[i], commentSearch(getSessionSave(newComments[i].session), location));
                if(newUnsavedComment != null && newUnsavedComment.isSaved){
                    clearMapComment(newUnsavedComment);
                }
            }   
        }
        refreshComments(); 
    }, 10000);
    
    function compareSessions(session1, session2){
        if(session2 != undefined) {
            if(session1.replyLength > session2.replyLength){
                if(session1.replies.length > session2.replies.length){
                    for(let i = 0; i < session1.replies.length - session2.replies.length; i++){
                        newComments.push(session1.replies[session2.replies.length + i]);
                    }
                }
                for(let i = 0; i < session1.replies.length; i++){
                    compareSessions(session1.replies[i], session2.replies[i]);
                }
            }    
        }
    }
}

async function getUsername(token){
    var response = await fetch(currentURL + "username:" + token, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    });
    response = await response.json();
    return response.username;
}

function commentSearch(sessionLoad, location){  
    var pointer = sessionLoad;
    
    for(let i = 0; i < location.length; i++){
        if(i == location.length-1){
            return pointer;
        } else {
            pointer = pointer.replies[parseInt(location[i])]
        }
    }
}




