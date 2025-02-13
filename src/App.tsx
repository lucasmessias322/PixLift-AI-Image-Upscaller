import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import SideBar from "./Components/SideBar";
import { ipcRenderer } from "electron";
import ImageComparison from "./Components/ImageComparison"; // Importe o novo componente

function App() {
  const [selectedModel, setSelectedModel] =
    useState<string>("realesrgan-x4plus");
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [enhancedImagePaths, setEnhancedImagePaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [Progress, setProgress] = useState<string>("");

  // Manipula o evento de soltar arquivos, evitando duplicatas
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      setOriginalImages((prev) => {
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

  // Processa as imagens sequencialmente
  const handleEnhanceImages = useCallback(async () => {
    if (originalImages.length === 0) return;
    setLoading(true);
    const newEnhancedPaths: string[] = [];

    for (const file of originalImages) {
      try {
        // Chama a API do Electron para melhorar a imagem
        const enhancedPath = await window.electronAPI.enhanceImage(
          file.path,
          selectedModel
        );
        newEnhancedPaths.push(enhancedPath);
      } catch (error) {
        console.error("Erro ao melhorar imagem:", error);
      }
    }

    setEnhancedImagePaths(newEnhancedPaths);
    setLoading(false);
  }, [originalImages, selectedModel]);

  const handleRemoveImage = useCallback((index: number) => {
    setOriginalImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleModelChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedModel(event.target.value);
    },
    []
  );

  // Listener para atualizar a imagem atual em processamento
  useEffect(() => {
    const handleCurrentImageUpdate = (imagePath: string) => {
      console.log("Imagem atual em processamento:", imagePath);
      setCurrentImage(imagePath);
    };

    window.electronAPI.onCurrentImageUpdate(handleCurrentImageUpdate);

    return () => {
      window.electronAPI.removeCurrentImageUpdateListener(
        handleCurrentImageUpdate
      );
    };
  }, []);

  useEffect(() => {
    const handleProgress = (progress: string) => {
      console.log("Progresso recebido:", progress);
      setProgress(progress);
    };

    window.electronAPI.onEnhanceProgress(handleProgress);
    return () => {
      window.electronAPI.removeEnhanceProgressListener(handleProgress);
    };
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
              <ImagesContainer>
                {originalImages.map((file, index) => (
                  <ImageWrapper
                    key={index}
                    isBeingUpscaled={currentImage == file.path}
                  >
                    <div className="ImagenAndRemoveBTN">
                      <RemoveButton onClick={() => handleRemoveImage(index)}>
                        X
                      </RemoveButton>
                      <Image
                        draggable="false"
                        src={URL.createObjectURL(file)}
                        alt={`Uploaded ${index}`}
                      />
                    </div>

                    {loading && currentImage == file.path && (
                      <ImageProgreesBar>
                        <progress
                          id="progress-bar"
                          value={Progress}
                          max="100"
                        ></progress>
                        <span>{Progress}%</span>
                      </ImageProgreesBar>
                    )}
                  </ImageWrapper>
                ))}
              </ImagesContainer>
            </Gallery>

            {/* Se houver imagens melhoradas, exibe a galeria de comparação */}

            {enhancedImagePaths.length > 0 && (
              <ComparisonGallery>
                <h2>Comparação</h2>
                <ComparisonContainer>
                  {originalImages.map((file, index) => (
                    <ComparisonWrapper key={index}>
                      <ImageComparison
                        originalSrc={URL.createObjectURL(file)}
                        enhancedSrc={enhancedImagePaths[index] || ""}
                      />
                    </ComparisonWrapper>
                  ))}
                </ComparisonContainer>
              </ComparisonGallery>
            )}
          </>
        )}
      </Content>

      <SideBar
        loading={loading}
        handleEnhanceImages={handleEnhanceImages}
        originalImages={originalImages}
        handleModelChange={handleModelChange}
        selectedModel={selectedModel}
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
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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
  margin: auto;

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

const ImageWrapper = styled.div<{ isBeingUpscaled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 215px;
  height: 265px;
  border-radius: 5px;
  padding: 10px;
  ${({ isBeingUpscaled }) =>
    isBeingUpscaled &&
    ` background-color: #1f1e1e;
  `};

  div.ImagenAndRemoveBTN {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
  }
`;

const ImageProgreesBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 10px;

  span {
    text-align: center;
    //padding-left: 10px;
    font-size: 14px;
  }

  progress {
    width: 100%;
    height: 3px;
    border-radius: 0;
    margin-bottom: 10px;
  }

  progress::-webkit-progress-bar {
    background-color: #21023b;
    border-radius: 0;
  }

  progress::-webkit-progress-value {
    background-color: #6e00c9;
    border-radius: 0;
  }
`;

const Image = styled.img`
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 5px;
  border: 2px solid #6e00c9;
`;

const RemoveButton = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 5px;
  right: 5px;
  height: 10px;
  width: 10px;
  background-color: rgba(0, 0, 0, 0.61);
  color: white;
  border: none;
  padding: 15px;
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

const ComparisonGallery = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;
// Container para cada comparação
const ComparisonContainer = styled.div`
  width: 100%;
  display: flex;
  //justify-content: center;
  // align-items: center;
  flex-wrap: wrap;
`;

const ComparisonWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  margin: auto 5px;
`;
