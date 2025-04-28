"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface ConfettiPiece {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    const colors = ["#FFA94D", "#FFD8A8", "#FFC078", "#FF922B", "#FD7E14"]
    const newPieces: ConfettiPiece[] = []

    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
      })
    }

    setPieces(newPieces)

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([])
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="confetti">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: `${piece.y}vh`,
            rotate: piece.rotation,
          }}
          animate={{
            y: "100vh",
            rotate: piece.rotation + 360,
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
          }}
        />
      ))}
    </div>
  )
}
