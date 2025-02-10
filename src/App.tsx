import React, { useCallback, useState } from "react";
import styled from "styled-components";
import SideBar from "./Components/SideBar";

function App() {
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [enhancedImagePaths, setEnhancedImagePaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Manipula o evento de soltar arquivos, impedindo duplicatas
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      setOriginalImages((prev) => {
        // Filtra apenas os arquivos que ainda não foram adicionados
        const newUniqueImages = imageFiles.filter(
          (newFile) =>
            !prev.some((existingFile) => existingFile.path === newFile.path)
        );
        return [...prev, ...newUniqueImages];
      });
    }
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  // Processa as imagens de forma sequencial usando um loop for-of
  const handleEnhanceImages = useCallback(async () => {
    if (originalImages.length === 0) return;
    setLoading(true);
    const newEnhancedPaths: string[] = [];

    for (const file of originalImages) {
      try {
        // Chama a API do Electron para melhorar a imagem
        const enhancedPath = await window.electronAPI.enhanceImage(file.path);
        newEnhancedPaths.push(enhancedPath);
      } catch (error) {
        console.error("Erro ao melhorar imagem:", error);
      }
    }

    setEnhancedImagePaths(newEnhancedPaths);
    setLoading(false);
  }, [originalImages]);

  const handleRemoveImage = useCallback((index: number) => {
    setOriginalImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Container onDrop={handleDrop} onDragOver={handleDragOver}>
      <Content>
        {originalImages.length === 0 ? (
          <DropZone>
            <p>Arraste e solte imagens aqui</p>
          </DropZone>
        ) : (
          <>
            <Gallery>
              {/* <h2>Imagens Originais</h2> */}
              <ImagesContainer>
                {originalImages.map((file, index) => (
                  <ImageWrapper key={index}>
                    <RemoveButton onClick={() => handleRemoveImage(index)}>
                      X
                    </RemoveButton>
                    <Image
                      draggable="false"
                      src={URL.createObjectURL(file)}
                      alt={`Uploaded ${index}`}
                    />
                  </ImageWrapper>
                ))}
              </ImagesContainer>
            </Gallery>

            {enhancedImagePaths.length > 0 && (
              <Gallery>
                <h2>Imagens Melhoradas</h2>
                <ImagesContainer>
                  {enhancedImagePaths.map((src, index) => (
                    <Image
                      draggable="false"
                      key={index}
                      src={src}
                      alt={`Enhanced ${index}`}
                    />
                  ))}
                </ImagesContainer>
              </Gallery>
            )}
          </>
        )}
      </Content>

      <SideBar
        loading={loading}
        handleEnhanceImages={handleEnhanceImages}
        originalImages={originalImages}
      />
    </Container>
  );
}

export default App;

/* Styled Components */

const Container = styled.div`
  display: flex;
  height: 100vh;
`;

const Content = styled.div`
  width: 100%;
  height: 100vh;
  padding:  20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DropZone = styled.div`
  width: 100%;
  height: 100%;

  max-width: 600px;
  max-height: 400px;
  border: 2px dashed #6e00c9;
  border-radius: 20px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto auto;
  

  p {
    color: #8c00ff;
    font-size: 25px;
    font-weight: bold;
  }
`;

const Gallery = styled.div`
  margin-bottom: 20px;
  

  h2 {
    color: #6e00c9;
    margin-bottom: 10px;
  }
`;

const ImagesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 250px;
  height: 250px;
`;

const Image = styled.img`
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #6e00c9;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  height: 10px;
  width: 10px;
  background-color: rgba(0, 0, 0, 0.61);
  color: white;
  border: none;
  padding: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100%;

  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s;

  &:hover {
    background-color: #6e00c9;
  }

  ${ImageWrapper}:hover & {
    opacity: 1;
  }
`;
