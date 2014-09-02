$(function() {
	
	var connections = {};
	
	var Connection = function() {
		this.self = this;
		this.partnerId = "";
		this.IsEstablished = false;
		this.IsExchanged = false;
		this.peerConnection = null;
	};
	
	function getConnection(id) {
		return connections[id];
	}
	
	function removeConnection(id) {
		delete connections[id];
		// delete connections[id]
	}
	
	function addConnection(id, connection) {
		connections[id] = connection;
	}
	
	function getConnectionCnt() {
		return connections.length;
	}
	
	// CLIENT FUNCTION
	var CLIENT_ID;
	
	// ベンダープレフィックスを除外
	RTCPeerConnection = webkitRTCPeerConnection ||
		mozRTCPeerConnection ||
		msRTCPeerConnection ||
		RTCPeerConnection;

    // navigator.getUserMediaに統一
	navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia ||
		navigator.msGetUserMedia;
	
	// window.URLに統一
	URL = window.URL || window.webkitURL;
	
	// WebSocket接続
	var socket = io.connect();
	
		// OnOpenが呼び出されているか確かめる
	socket.on('connect', function (message) {
		console.log("broadcast on_open log");
		
		//var json = JSON.parse(message);

		//console.log("connection_id is " + json.connection_id);
	});

		
	var mediaConstraints = {
		'mandatory': {
				'OfferToReceiveAudio': false, 
				'OfferToReceiveVideo': true,
				'IceRestart': true
		}
	};
	
	var peerConnection = prepareNewConnection();
	var localStream, remoteStream;
	
	
	// 接続する際にいくつのコネクションを張るかサーバに問い合わせ
	$(".test").on("event", function() {
			socket.emit("clients", socket.id);
	});
	
	socket.on("clients", function(remoteConnections) {
		
	});
	
	// Click Event of Connect
	$("#connect").on("click", connect);
	
	function connect() {
		sendOffer();
	}
	
	function sendOffer() {
		if (!peerConnection) {
			//console.log('peerConnection not exist! AND Create peerConnection');
	  		peerConnection = prepareNewConnection();	
		}
		
		//console.log("sendOffer() iceConnectionState is " + peerConnection.iceConnectionState);

		peerConnection.addStream(localStream);
		console.log("------add localStream------");

		peerConnection.createOffer(function(sessionDescription){
			peerConnection.setLocalDescription(sessionDescription);
			socket.emit("sendOffer", JSON.stringify({sdp: sessionDescription, guid: CLIENT_ID}));
			console.log("Create Offer Success");
		},
		function() {
			console.log("Create Offer Failed");
		}, mediaConstraints);
	}
	
	function prepareNewConnection() {
		if (peerConnection) {
	  		console.log('peerConnection alreay exist!');
	  		return peerConnection;
	  	}
		
		var peer = new RTCPeerConnection({
          'iceServers': [
            // {url:'stun:stun01.sipphone.com'},
            // {url:'stun:stun.ekiga.net'},
            // {url:'stun:stun.fwdnet.net'},
            // {url:'stun:stun.ideasip.com'},
            // {url:'stun:stun.iptel.org'},
            // {url:'stun:stun.rixtelecom.se'},
            // {url:'stun:stun.schlund.de'},
            {url:'stun:stun.l.google.com:19302'},
            // {url:'stun:stun1.l.google.com:19302'},
            // {url:'stun:stun2.l.google.com:19302'},
            // {url:'stun:stun3.l.google.com:19302'},
            // {url:'stun:stun4.l.google.com:19302'},
            // {url:'stun:stunserver.org'},
            // {url:'stun:stun.softjoys.com'},
            // {url:'stun:stun.voiparound.com'},
            // {url:'stun:stun.voipbuster.com'},
            // {url:'stun:stun.voipstunt.com'},
            // {url:'stun:stun.voxgratia.org'},
            // {url:'stun:stun.xten.com'},
            // { url: 'stun:stun.skyway.io:3478' },
            // {
            //     url: 'turn:numb.viagenie.ca',
            //     credential: 'muazkh',
            //     username: 'webrtc@live.com'
            // },
            // {
            //     url: 'turn:192.158.29.39:3478?transport=udp',
            //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            //     username: '28224511:1379330808'
            // },
            // {
            //     url: 'turn:192.158.29.39:3478?transport=tcp',
            //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            //     username: '28224511:1379330808'
            // },
            // // {
            //     url: 'turn:homeo@turn.bistri.com:80',
            //     credential: 'homeo'
            // }
          ]
        });
		
		peer.onicecandidate = function (evt) {
			console.log("iceGatheringState is " + evt.target.iceGatheringState);
			
			if (evt.candidate) {
				console.log(evt.candidate);
				socket.emit("candidate", JSON.stringify({ candidate: evt.candidate, guid: CLIENT_ID}));
			} else {
				console.log("End of candidates.");
				
				// var iceState = peerConnection.iceConnectionState;
				
				// if (iceState == "connected" || iceState == "complete")return;
				
				// if ((iceState == "checking" || iceState == "failed") || evt.target.iceGatheringState == "complete") {
				//     console.log("------Resend offer on the end of candidate------");
				//     sendOffer();
				// }
			}
		};
		
		peer.onnegotiationneeded = function(evt) {
			console.log("------on negotiation callback------");
			// socket.trigger("sendOffer", evt);
		}
		
		peer.onaddstream = onRemoteStreamAdded;
		
		peer.oniceconnectionstatechange = function(evt) {
		    console.log("ICE connection state change: " + evt.target.iceConnectionState);
		    
		    console.log("testtesttesttest " + peer.iceConnectionState);
		    
		    if(peer.iceConnectionState == 'completed') {
		      var message = 'WebRTC RTP ports are connected to UDP. ';
		      message += 'Wait a few seconds for remote stream to be started flowing.';
		      alert(message);
		    }
		    // don't move
		    // if (evt.target.iceConnectionState == "failed") {
		    // 	sendOffer();
		    // 	console.log("------Resend Offer oniceconnectionstatechange------");
		    // }
		};

		return peer;
	}
	
	// Callback sendOffer
	socket.on("sendOffer", onOffer);
	
	function onOffer(evt) {
	    var json = JSON.parse(evt);

// 		if(json.guid == CLIENT_ID) return;
		console.log("------receive offer------");
		
		// console.log("onOffer() iceConnectionState is " + peerConnection.iceConnectionState);
		
		setOffer(json);
		sendAnswer(json);
	}
	
	function setOffer(evt) {
	    // console.log("setOffer() iceConnectionState is " + peerConnection.iceConnectionState);
		peerConnection = prepareNewConnection();
		peerConnection.setRemoteDescription(new RTCSessionDescription(evt.sdp));
	}
	
	function sendAnswer(evt) {
	    if (!peerConnection || peerConnection.remoteDescription.type != "offer")return;

	    // console.log("sendAnswer() iceConnectionState is " + peerConnection.iceConnectionState);
		peerConnection.createAnswer(function(sdp) {
		    peerConnection.setLocalDescription(sdp);
			socket.emit("sendAnswer", JSON.stringify({sdp: sdp, guid: CLIENT_ID}));
			console.log("Create Answer Success");
		},
		function() {
			console.log("Create Answer Failed");
		}, mediaConstraints);
	}
	
	// Callback sendAnswer
	socket.on("sendAnswer", onAnswer);
	
	function onAnswer(evt) {
		var json = JSON.parse(evt);
		
		if (!peerConnection) {
			console.log("Error peerConnection NOT EXIST!!");
			return;
		}

		// console.log("onAnswer() iceConnectionState is " + peerConnection.iceConnectionState);

		// peerConnection.createOffer(function(sdp) {
			// peerConnection.setLocalDescription(sdp);
		// });
		setAnswer(json);
	}
	
	function setAnswer(evt) {
// 		if(evt.guid == CLIENT_ID) return;

		console.log("------receive answer------");
		// console.log("setAnswer() iceConnectionState is " + peerConnection.iceConnectionState);
		
		var sdp = new RTCSessionDescription(evt.sdp);
		// if (evt.guid != GUID) {
			peerConnection.setRemoteDescription(sdp);
			console.log("------set remoteDescription------");
		// }
	}
	
	socket.on("candidate", onCandidate);
	
	function onCandidate(evt) {
	  var json = JSON.parse(evt);
	  // console.log("!!!!!!callback of candidate!!!!!!");
	  console.log("onCandidate() iceConnectionState is " + peerConnection.iceConnectionState);

	  peerConnection.addIceCandidate(new RTCIceCandidate(json.candidate),
	    function(evt) { 
	      console.log("success"); 
	    }, 
	    function(evt) { 
	          console.log("error"); 
	    });
	}
	
	function onRemoteStreamAdded(evt) {
      console.log("Added Remote Stream");
      
      console.log("Remote Stream is " + evt.stream);
      $("#remote_tv")[0].src = URL.createObjectURL(evt.stream);
      $("#remote_tv")[0].play();

      console.log("onRemoteStreamAdded() iceConnectionState is " + peerConnection.iceConnectionState);
      console.log("srcElement's iceConnectionState is " + evt.srcElement.iceConnectionState);
      console.log("target's iceConnectionState is " + evt.target.iceConnectionState);
      console.log("currentTarget's iceConnectionState is " + evt.currentTarget.iceConnectionState);
    }
	
	// navigator.getUserMediaを実行
	if (!navigator.getUserMedia) {
		alert("WebRTC is not supported!!");
		return false;
	} else {
		navigator.getUserMedia({video: true, audio: false}, function(stream) {
			// video要素の取得
			var video = $("#my_tv")[0];
			
			// srcにBlob URLを指定するとカメラの画像がストリームで流れる
	        video.src = URL.createObjectURL(stream);
	        video.play();
	        
	        // 自分のpeerにカメラストリームを接続させる
	        // RTC接続確立後に相手のストリームに渡される
	        localStream = stream;
			 
		}, function(error) {
			alert(error.name);
		});
	}
	
	
	// メッセージ受信時の処理
    socket.on("websocket_chat", function(message){
  	  console.log("websocket_chat message is " + message);
    });
    
    
    socket.on("disconnect", function(removeConnectionId) {
    	console.log(removeConnectionId + "'s client out");	
    	removeConnection(removeConnectionId);
    });

	// メッセージ送信時の処理
	$("#send").on("click", function(){
	　var comment = $("#comment").val();
	　socket.emit('websocket_chat', comment);
	});

});
