import React, { useState } from "react"

const Chat = ({ messages }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <div
        style={{
          height: expanded ? 400 : 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column-reverse",
          transition: "height 350ms ease-in-out",
        }}
      >
        <p>Messages go here</p>
      </div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Collapse' : 'Expand'} chat
      </button>
    </>
  )
}

export default Chat
