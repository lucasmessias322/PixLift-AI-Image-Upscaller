import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import SideBar from "./Components/SideBar";
import ImageComparison from "./Components/ImageComparison";

interface ImageItem {
  file: File;
  enhancedPath?: string;
}

function App() {
  const [selectedModel, setSelectedModel] =
    useState<string>("realesrgan-x4plus");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [selectedComparison, setSelectedComparison] =
    useState<ImageItem | null>(null);

  // Seleciona a pasta via canal IPC
  const handleSelectFolder = useCallback(async () => {
    const folder = await window.electronAPI.selectFolder();
    setSelectedFolder(folder);
  }, []);

  // Permite selecionar múltiplas imagens via input (além do drop)
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter((file) =>
          file.type.startsWith("image/")
        );
        setImages((prev) => {
          const newImages = imageFiles
            .filter(
              (file) => !prev.some((item) => item.file.path === file.path)
            )
            .map((file) => ({ file }));
          // Adiciona as novas imagens no início do array
          return [...newImages, ...prev];
        });
      }
    },
    []
  );

  // Drop de múltiplas imagens
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      setImages((prev) => {
        const newImages = imageFiles
          .filter((file) => !prev.some((item) => item.file.path === file.path))
          .map((file) => ({ file }));
        // Adiciona as novas imagens no início do array
        return [...newImages, ...prev];
      });
    }
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  // Processa as imagens pendentes e atualiza cada item com o enhancedPath
  const handleEnhanceImages = useCallback(async () => {
    const imagesToProcess = images.filter((item) => !item.enhancedPath);
    if (imagesToProcess.length === 0) return;
    setLoading(true);

    for (const item of imagesToProcess) {
      try {
        setCurrentImage(item.file.path);
        const enhancedPath = await window.electronAPI.enhanceImage(
          item.file.path,
          selectedModel,
          selectedFolder
        );
        setImages((prev) =>
          prev.map((img) =>
            img.file.path === item.file.path ? { ...img, enhancedPath } : img
          )
        );
      } catch (error) {
        console.error("Erro ao melhorar imagem:", error);
      }
    }
    setCurrentImage("");
    setLoading(false);
  }, [images, selectedModel, selectedFolder]);

  const handleRemoveImage = useCallback((filePath: string) => {
    setImages((prev) => prev.filter((item) => item.file.path !== filePath));
  }, []);

  const handleModelChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedModel(event.target.value);
    },
    []
  );

  useEffect(() => {
    const handleCurrentImageUpdate = (imagePath: string) => {
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
    const handleProgressUpdate = (progress: string) => {
      setProgress(progress);
    };
    window.electronAPI.onEnhanceProgress(handleProgressUpdate);
    return () => {
      window.electronAPI.removeEnhanceProgressListener(handleProgressUpdate);
    };
  }, []);

  return (
    <Container onDrop={handleDrop} onDragOver={handleDragOver}>
      <Content>
        {images.length === 0 && (
          <DropZone>
            <p>Arraste e solte imagens aqui</p>
            <FileInput
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              multiple
              onChange={handleFileInputChange}
            />
          </DropZone>
        )}

        {images.length > 0 && (
          <Gallery>
            <ImagesContainer>
              {images.map((item, index) =>
                item.enhancedPath ? (
                  // Imagem convertida – permanece na mesma posição
                  <ImageConvertedWrapper
                    key={index}
                    onClick={() => setSelectedComparison(item)}
                  >
                    <ImageConverted draggable="false" src={item.enhancedPath} />
                  </ImageConvertedWrapper>
                ) : (
                  // Imagem pendente – exibe botão de remover, e se estiver sendo processada, aplica blur somente na imagem
                  <ImageWrapper
                    key={index}
                    isBeingUpscaled={loading && currentImage === item.file.path}
                  >
                    <div className="ImagenAndRemoveBTN">
                      {!loading && (
                        <RemoveButton
                          onClick={() => handleRemoveImage(item.file.path)}
                        >
                          X
                        </RemoveButton>
                      )}
                      <Image
                        draggable="false"
                        src={URL.createObjectURL(item.file)}
                        alt={`Uploaded ${index}`}
                        style={{
                          filter:
                            loading && currentImage === item.file.path
                              ? "blur(5px)"
                              : "none",
                        }}
                      />{" "}
                      {loading && currentImage === item.file.path && (
                        <ImageProgreesBar>
                          <progress
                            id="progress-bar"
                            value={progress}
                            max="100"
                          ></progress>
                          <span>{progress}%</span>
                        </ImageProgreesBar>
                      )}
                    </div>
                  </ImageWrapper>
                )
              )}
            </ImagesContainer>
          </Gallery>
        )}

        {selectedComparison && (
          <ComparisonPopUp>
            <div className="Wrapper">
              <CloseButton onClick={() => setSelectedComparison(null)}>
                X
              </CloseButton>
              <ImageComparison
                originalSrc={URL.createObjectURL(selectedComparison.file)}
                enhancedSrc={selectedComparison.enhancedPath as string}
              />{" "}
            </div>
          </ComparisonPopUp>
        )}
      </Content>

      <SideBar
        loading={loading}
        handleEnhanceImages={handleEnhanceImages}
        pendingImages={images.filter((item) => !item.enhancedPath)}
        handleModelChange={handleModelChange}
        selectedModel={selectedModel}
        selectedFolder={selectedFolder}
        handleSelectFolder={handleSelectFolder}
      />
    </Container>
  );
}

export default App;

// /* Styled Components */

const Container = styled.div`
  display: flex;
  height: 100vh;
`;

const Content = styled.div`
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const DropZone = styled.div`
  width: 95%;
  height: 95%;
  max-width: 600px;
  max-height: 400px;
  border: 2px dashed #6e00c9;
  border-radius: 20px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto;

  p {
    color: #8c00ff;
    font-size: 25px;
    font-weight: bold;
  }
`;
const FileInput = styled.input`
  margin-top: 20px;
`;
const Gallery = styled.div`
  padding: 20px;
  h2 {
    padding: 10px;
    color: #af4dff;
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
  width: 250px;
  height: 250px;

  /* ${({ isBeingUpscaled }) =>
    isBeingUpscaled &&
    `
      background-color: #1f1e1e;
  `}; */

  div.ImagenAndRemoveBTN {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
  }

  border: 5px solid #6e00c9;

  border-left: 2.5px solid #6e00c9;
  border-right: 2.5px solid #6e00c9;
`;

const ImageProgreesBar = styled.div`
  position: absolute;
  bottom: 5px;
  left: 5px;
  right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 5px;

  progress {
    width: 100%;
    height: 8px;
    border-radius: 5px;
  }

  progress::-webkit-progress-bar {
    background-color: #21023b;
    border-radius: 5px;
  }

  progress::-webkit-progress-value {
    background-color: #af4dff;
    border-radius: 5px;
  }

  span {
    margin-left: 5px;
    color: #af4dff;
    font-weight: bold;
    font-size: 12px;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;

  /* border-radius: 5px; */
  ///padding: 5px;
  /* border: 2px solid #6e00c9; */
  filter: opacity(0.1);
`;

const RemoveButton = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9;
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
  z-index: 99999999999;
`;

const ImageConvertedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 250px;
  height: 250px;
  cursor: pointer;
  border: 5px solid whitesmoke;
  border-left: 2.5px solid whitesmoke;
  border-right: 2.5px solid whitesmoke;

  &:hover {
    transition: 0.5s;
    transform: scale(1.02);
    // box-shadow: 2px 2px 2px 2px #000000ac;
  }
`;

const ImageConverted = styled.img`
  width: 100%;
  height: 100%;

  object-fit: cover;
  /* border: 5px solid white;
  border-left: 2px solid white;
  border-right: 2px solid white; */
`;

const ComparisonPopUp = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  background-color: #080808d5;
  z-index: 9999;
  div.Wrapper {
    /* display: flex;
    justify-content: center; */
    padding: 20px;

    width: 100%;
    height: 100%;
    margin: 0 auto;
    max-height: 80%;
    max-width: 80%;
  }
`;

const CloseButton = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  top: 15px;
  right: 15px;

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

  background-color: #6e00c9;
`;
