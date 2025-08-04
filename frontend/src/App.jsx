import React, { useEffect } from 'react'
import "./App.css";
import io from "socket.io-client"
import { useState } from 'react';
import { Editor } from "@monaco-editor/react";
import { FaCopy, FaUsers, FaSignOutAlt, FaKeyboard } from 'react-icons/fa';
import {v4 as uuid} from "uuid";

const socket=io("http://localhost:5000");

const App = () => {
  const [join, setjoin]= useState(false);
  const [roomId, setRoomId]=useState("");
  const [userName, setUserName]=useState("");
  const [language,setlanguage]=useState("javascript");
  const [code, setCode]=useState("//start code here")
  const [copysuccess, setCopysuccess]=useState("");
  const [users, setUsers]= useState([]);
  const [typing, setTyping]=useState("");
  const [outPut, setOutput]= useState("");
  const [version, setVersion]=useState("*");
  const [userInput, setuserInput]= useState("");

  useEffect(()=>{
    socket.on("userJoined",(users)=>{
      setUsers(users);
    });

   socket.on("codeUpdate",(newCode)=>{
    setCode(newCode);
   })
   
   socket.on("userTyping",(user)=>{
    setTyping(`${user.slice(0,8)}...is typing`);
    setTimeout(()=>setTyping(""),2000)
   })

   socket.on("languageUpadte",(newLanguage)=>{
    setlanguage(newLanguage);
   });

  socket.on("codeResponse", (response) => {
  setOutput(response.output || "No output");
});
   
    return ()=>{
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpadte");
      socket.off("codeResponse");
    }
  },[])
  

  useEffect(()=>{
    const handleBeforeUnload=()=>{
       socket.emit("leaveRoom")
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    return ()=>{
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  const handleRom=()=>{
    if(roomId && userName)
    {
      socket.emit("join",{roomId,userName});
      setjoin(true);
    }
  }

const copyRoomId=()=>{
     navigator.clipboard.writeText(roomId);
     setCopysuccess("Copied!")
     setTimeout(()=>setCopysuccess(""),2000);
}

const handelCodeChange=(newCode)=>{
  setCode(newCode);
  socket.emit("codeChange",{roomId, code: newCode})
  socket.emit("typing",{roomId, userName});
}


const handleLaguageChange=e=>{
  const newLanguage= e.target.value;
  setlanguage(newLanguage);
  socket.emit("languageChange",{roomId, language: newLanguage})
}


const leaveRoom=()=>{
socket.emit("leaveRoom");
setjoin(false);
setRoomId("");
setUserName("");
setCode("//start code here");
setlanguage("javascript");
}

const runCode=()=>{
 socket.emit("compileCode", { code, roomId, language, version, input : userInput});
}

const createRoomId=()=>{
  const roomId=uuid();
  setRoomId(roomId);
}

  if(!join)
  {
    return <div className="page-wrapper">
  <h1 className="page-title">Real-Time Code Editor</h1>

  <div className="join-container">
    <div className="join-form">
      <h1>Join Room</h1>
      <input
        type="text"
        placeholder="Room Id"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button style={{marginBottom:"14px"}} onClick={createRoomId}>Auto Create Id</button>
      <input
        type="text"
        placeholder="User Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <button onClick={handleRom}>Join Room</button>
    </div>
  </div>
</div>

  }

  return (
    <div className='editor-container'>
  <div className='sidebar'>
    <div className='room-info'>
      <h2 style={{textAlign:"center"}}>💻 Code Room: {roomId}</h2>
      <button onClick={copyRoomId}>
        <FaCopy style={{ marginRight: "5px" }} />
        Copy Id
      </button>
     {copysuccess && <span className='copy-success' style={{marginLeft:".5rem", color:"green", fontSize:"0.8rem"}}>{copysuccess}</span>}
    </div>

    <h3><FaUsers style={{ marginRight: "5px" }} />Users in Room:</h3>
    <ul>
      {users.map((user, index)=>(
        <li key={index}>{user.slice(0,8)}...</li>
      ))}
    </ul>

    <p className='typing-indicator' style={{color:"green"}}>
      <FaKeyboard style={{ marginRight: "5px" }} />
      {typing}
    </p>

    <select className='lagunage-selector' value={language} onChange={handleLaguageChange}>
      <option value="javascript">JavaScript</option>
      <option value="java">Java</option>
      <option value="cpp">C++</option>
      <option value="python">Python</option>
      <option value="c">C</option>
    </select>

    <button className='leave-button' onClick={leaveRoom}>
      <FaSignOutAlt style={{ marginRight: "5px" }} />
      Leave Room
    </button>
  </div>

  <div className='editor-wrapper'>
    <Editor
      height={"63%"}
      defaultLanguage={language}
      language={language}
      value={code}
      onChange={handelCodeChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
      }}
    />
    <textarea className='input-console' value={userInput} onChange={(e)=>setuserInput(e.target.value)} placeholder='Enter input here..'  />
    <button className='run-btn' onClick={runCode}>Execute</button>
    <textarea className='output-console' value={outPut} readOnly placeholder='Output will appear herer ...'/>
  </div>
</div>

  )
}

export default App