import React, { useState } from "react"

const Chat = ({ messages, userMap, isActive, userHasPermissions, handleSendChat }) => {
  const [expanded, setExpanded] = useState(true)
  const [currMessage, setCurrMessage] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    handleSendChat(currMessage)
    setCurrMessage('')
  }
  return (
    <>
      <div
        style={{
          maxHeight: expanded ? 400 : 0,
          maxWidth: 400,
          overflow: "auto",
          display: "flex",
          flexDirection: "column-reverse",
          transition: "max-height 350ms ease-in-out",
        }}
      >
        {isActive && userHasPermissions ?
          <form onSubmit={handleSubmit}>
            <textarea
              name="prediction-chat"
              rows="2"
              cols="25"
              value={currMessage}
              onChange={(e) => setCurrMessage(e.target.value)}
            />
            <br/>
            <input type="submit" value="Send" style={{marginBottom: 4}} />
          </form>
          :
          null
        }
        {messages.length > 0 ?
          messages.map(message => (
            <span key={message.id}>
              <span style={{
                backgroundColor: (message.type === "notification") ? "#eaeaea" : "inherit",
                display: (message.type === "notification") ? "block" : "unset",
              }}>
                <span
                  style={{
                    backgroundColor: userMap[message.userId].color || 'inherit',
                    height: 10,
                    width: 10,
                    borderRadius: 5,
                    display: 'inline-block'
                  }}
                ></span>&nbsp;
                <strong>{message.username}</strong>&nbsp;
                <span style={{color: "grey"}}>
                  {message.created}
                </span>
                <br/>
                <span style={{fontStyle: (message.type === "notification") ? "italic" : "inherit"}}>
                  {message.text}
                </span>
              </span>
              <hr/>
            </span>
          ))
          :
          <span style={{marginBottom: 5}}><em>No messages yet</em></span>
        }
      </div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Collapse' : 'Expand'} chat
      </button>
    </>
  )
}

export default Chat
