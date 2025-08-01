import express from "express";
import dotenv from "dotenv";
import {Server} from "socket.io";
import http from "http";
import path from "path";
import axios from "axios";
import getFileExtension from "./helper/getFileExtension.js";


const app=express();

const server=http.createServer(app);

const url = `https://realtime-code-editor-final.onrender.com`;
const interval = 30000;

function reloadWebsite() {
  axios
    .get(url)
    .then((response) => {
      console.log("website reloded");
    })
    .catch((error) => {
      console.error(`Error : ${error.message}`);
    });
}

setInterval(reloadWebsite, interval);


const io=new Server(server,{
    cors:{
        origin:"*",
    },
});


//join method
const rooms=new Map();

io.on("connection",(socket)=>{
    console.log("User Connected!", socket.id);
    //start
    let currentRoom=null;
    let currentUser=null;
    socket.on("join",({roomId,userName})=>{
            if(currentRoom)
            {
                socket.leave(currentRoom)
                rooms.get(currentRoom).delete(currentUser)
                io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)))
            }
            currentRoom=roomId;
            currentUser=userName;
      
            socket.join(roomId)
            if(!rooms.has(roomId)){
                rooms.set(roomId, new Set());
            }
            rooms.get(roomId).add(userName);
            io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)))
    });
    
    socket.on("codeChange",({roomId, code})=>{
        socket.to(roomId).emit("codeUpdate",code);
    });

    socket.on("leaveRoom",()=>{
           if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)))

            socket.leave(currentRoom);
            currentRoom=null;
            currentUser=null;
        }
    })

    socket.on("typing",({roomId, userName})=>{
        socket.to(roomId).emit("userTyping", userName)
    })

    socket.on("languageChange",({roomId, language})=>{
        io.to(roomId).emit("languageUpadte", language );
    });

  socket.on("compileCode", async ({ code, roomId, language, version }) => {
  try {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);

      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language,
        version,
        files: [
          {
            name: `main.${getFileExtension(language)}`,
            content: code
          }
        ]
      });

      const output = response.data.run?.output || "No output received";
      room.output = output;

      io.to(roomId).emit("codeResponse", {
        output,
        success: true
      });
    }
  } catch (error) {
    console.error("Code compilation error:", error.response?.data || error.message);
    io.to(roomId).emit("codeResponse", {
      output: "Compilation failed: " + (error.response?.data?.message || error.message),
      success: false
    });
  }
});

    socket.on("disconnect",()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)))
        }
        console.log("user discounected");
    })
})

const __dirname=path.resolve();

app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"frontend", "dist", "index.html"));
})

const Port=process.env.PORT || 5000;

server.listen(Port,()=>{
    console.log(`server is running Port http://localhost:5000`)
})

