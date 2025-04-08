import React, { useState, useRef } from "react";
import styled from "styled-components";

interface ImageComparisonProps {
  originalSrc: string;
  enhancedSrc: string;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalSrc,
  enhancedSrc,
}) => {
  const [divider, setDivider] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // Atualiza a posição do divider baseado na posição do mouse ou toque
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newDivider = ((clientX - rect.left) / rect.width) * 100;
    if (newDivider < 0) newDivider = 0;
    if (newDivider > 100) newDivider = 100;
    setDivider(newDivider);
  };

  const handleMouseDown = () => {
    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const onTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };

    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
  };

  return (
    <ComparisonWrapper ref={containerRef}>
      <span className="after">After</span>
      <span className="before">Before</span>
      {/* Imagem original em segundo plano */}
      <BaseImage draggable="false" src={originalSrc} alt="Original" />
      {/* Imagem melhorada em primeiro plano, com clip que varia conforme o divider */}

      
      <OverlayImage
        draggable="false"
        src={enhancedSrc}
        alt="Enhanced"
        divider={divider}
      />
      {/* Barra divisória */}
      <Divider
        style={{ left: `${divider}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />
    </ComparisonWrapper>
  );
};

export default ImageComparison;

const ComparisonWrapper = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
 // margin: 20px auto;
  user-select: none;
  border: 10px solid white;
  border-left: 5px solid white;
  border-right: 5px solid white;

  span {
    position: absolute;
    color: #ffffff;
    background-color: #0000006f;
    font-size: 16px;
    border-radius: 5px;
    margin: 5px;
    z-index: 99;
    padding:5px 10px;
    font-weight: bold;
  }

  span.before {
  }

  span.before {
   right:0px;
  }
`;

const BaseImage = styled.img`
  width: 100%;
  display: block;
  object-fit: contain;
`;

interface OverlayImageProps {
  divider: number;
}

const OverlayImage = styled.img<OverlayImageProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: block;
  /* Exibe somente a parte da imagem até o divider */
  clip-path: inset(0 calc(100% - ${(props) => props.divider}%) 0 0);
  pointer-events: none;
`;

const Divider = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #ffffff;
  //border-left: 2px solid white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.781);
  cursor: ew-resize;
  z-index: 10;
`;
