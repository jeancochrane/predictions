import React from 'react'

const Cursor = ({x, y, username, color}) => {
  return (
    <svg
      x="0px"
      y="0px"
      viewBox="1064.7701 445.5539 419.8101 717.0565"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: '10px'
      }}
    >
      <polygon
        fill={color ? color : "#656565"}
        points="1283.1857,1127.3097 1406.1421,1077.6322 1314.2406,850.1678 1463.913,852.7823 1093.4828,480.8547
      1085.4374,1005.6964 1191.2842,899.8454"
      />
    </svg>
  )
}


export default Cursor
