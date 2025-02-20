import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import SideBar from "./Components/SideBar";
import ImageComparison from "./Components/ImageComparison";

interface ConvertedImage {
  file: File;
  enhancedPath: string;
}

function App() {
  const [selectedModel, setSelectedModel] =
    useState<string>("realesrgan-x4plus");
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  // Novo estado para controlar a imagem selecionada para comparação
  const [selectedComparison, setSelectedComparison] =
    useState<ConvertedImage | null>(null);

  // Função para selecionar a pasta usando o canal IPC "selectFolder"
  const handleSelectFolder = useCallback(async () => {
    const folder = await window.electronAPI.selectFolder();
    setSelectedFolder(folder);
  }, []);

  // Manipula o evento de soltar arquivos, evitando duplicatas
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      setPendingImages((prev) => {
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

  // Processa as imagens pendentes sequencialmente.
  const handleEnhanceImages = useCallback(async () => {
    if (pendingImages.length === 0) return;
    setLoading(true);

    // Cria uma cópia das imagens pendentes para iterar
    const imagesToProcess = [...pendingImages];

    for (const file of imagesToProcess) {
      try {
        const enhancedPath = await window.electronAPI.enhanceImage(
          file.path,
          selectedModel,
          selectedFolder
        );
        // Adiciona a imagem convertida à lista de comparação
        setConvertedImages((prev) => [...prev, { file, enhancedPath }]);
        // Remove a imagem convertida da lista de pendentes
        setPendingImages((prev) => prev.filter((p) => p.path !== file.path));
      } catch (error) {
        console.error("Erro ao melhorar imagem:", error);
      }
    }
    setLoading(false);
  }, [pendingImages, selectedModel, selectedFolder]);

  // Permite remover manualmente uma imagem pendente
  const handleRemoveImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
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
        {pendingImages.length == 0 && convertedImages.length == 0 && (
          <DropZone>
            <p>Arraste e solte imagens aqui</p>
          </DropZone>
        )}
        {pendingImages.length >0 &&
          <Gallery>
            <h2>Images to Upscale</h2>
            <ImagesContainer>
              {pendingImages.map((file, index) => (
                <ImageWrapper
                  key={index}
                  isBeingUpscaled={currentImage === file.path}
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
                  {loading && currentImage === file.path && (
                    <ImageProgreesBar>
                      <progress
                        id="progress-bar"
                        value={progress}
                        max="100"
                      ></progress>
                      <span>{progress}%</span>
                    </ImageProgreesBar>
                  )}
                </ImageWrapper>
              ))}
            </ImagesContainer>
          </Gallery>
        }

        {convertedImages.length > 0 && (
          <ConvertedGallery>
            <h2>Upscaled Images:</h2>
            <ImageConvertedContainer>
              {convertedImages.map((item, index) => (
                <ImageConvertedWrapper
                  key={index}
                  onClick={() => setSelectedComparison(item)} // Ao clicar, abre o popup
                >
                  <ImageConverted draggable="false" src={item.enhancedPath} />
                </ImageConvertedWrapper>
              ))}
            </ImageConvertedContainer>
          </ConvertedGallery>
        )}

        {/* Popup de comparação, renderizado condicionalmente */}
        {selectedComparison && (
          <ComparisonPopUp>
            <CloseButton onClick={() => setSelectedComparison(null)}>
              X
            </CloseButton>
            <ImageComparison
              originalSrc={URL.createObjectURL(selectedComparison.file)}
              enhancedSrc={selectedComparison.enhancedPath}
            />
          </ComparisonPopUp>
        )}
      </Content>

      <SideBar
        loading={loading}
        handleEnhanceImages={handleEnhanceImages}
        pendingImages={pendingImages}
        handleModelChange={handleModelChange}
        selectedModel={selectedModel}
        selectedFolder={selectedFolder}
        handleSelectFolder={handleSelectFolder}
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
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative; /* Necessário para posicionar o popup relativo a este container */
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
  //margin-bottom: 5px;

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
  width: 215px;
  height: 265px;
  border-radius: 5px;
  padding: 10px;
  ${({ isBeingUpscaled }) =>
    isBeingUpscaled &&
    `
      background-color: #1f1e1e;
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

const ConvertedGallery = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;

  h2 {
    padding: 10px;
    color: #af4dff;
  }
  // justify-content: center;
  //margin: 0 auto;
`;

const ImageConvertedContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;

  // justify-content: center;
  gap: 5px;
  padding: 15px 10px;
`;

const ImageConvertedWrapper = styled.div`
  width: 100%;
  @media (max-width: 900px) {
    max-width: 200px;
    max-height: 200px;
  }
  max-width: 250px;
  max-height: 250px;
  cursor: pointer;
`;

const ImageConverted = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 5px solid white;
  border-left: 2px solid white;
  border-right: 2px solid white;

  &:hover {
    transition: 0.5s;
    border: 5px solid #af4dff;
    border-left: 2px solid #af4dff;
    border-right: 2px solid #af4dff;
  }
`;

const ComparisonPopUp = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #080808d5;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10000;
  background-color: #6e00c9;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
`;
