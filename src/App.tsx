import React, { useCallback, useEffect, useState } from "react";
import SideBar from "./Components/SideBar";
import * as C from "./AppStyle";

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
          return [...prev, ...newImages];

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
       return [...prev, ...newImages];

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
    <C.Container onDrop={handleDrop} onDragOver={handleDragOver}>
      <C.Content>
        {images.length === 0 && (
          <C.DropZone>
            <p>Arraste e solte imagens aqui</p>
            <C.FileInput
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              multiple
              onChange={handleFileInputChange}
            />
          </C.DropZone>
        )}

        {images.length > 0 && (
          <C.Gallery>
            <C.ImagesContainer>
              {images.map((item, index) =>
                item.enhancedPath ? (
                  // Imagem convertida – permanece na mesma posição
                  <C.ImageConvertedWrapper
                    key={index}
                    onClick={() => setSelectedComparison(item)}
                  >
                    <C.ImageConverted
                      loading="lazy"
                      draggable="false"
                      //src={item.enhancedPath}

                      src={URL.createObjectURL(item.file)}
                    />
                  </C.ImageConvertedWrapper>
                ) : (
                  // Imagem pendente – exibe botão de remover, e se estiver sendo processada, aplica blur somente na imagem
                  <C.ImageWrapper
                    key={index}
                    isBeingUpscaled={loading && currentImage === item.file.path}
                  >
                    <div className="ImagenAndRemoveBTN">
                      {!loading && (
                        <C.RemoveButton
                          onClick={() => handleRemoveImage(item.file.path)}
                        >
                          X
                        </C.RemoveButton>
                      )}
                      <C.Image
                        draggable="false"
                        src={URL.createObjectURL(item.file)}
                        alt={`Uploaded ${index}`}
                        loading="lazy"
                        style={{
                          filter:
                            loading && currentImage === item.file.path
                              ? "blur(5px)"
                              : "none",
                        }}
                      />{" "}
                      {loading && currentImage === item.file.path && (
                        <C.ImageProgreesBar>
                          <progress
                            id="progress-bar"
                            value={progress}
                            max="100"
                          ></progress>
                          <span>{progress}%</span>
                        </C.ImageProgreesBar>
                      )}
                    </div>
                  </C.ImageWrapper>
                )
              )}
            </C.ImagesContainer>
          </C.Gallery>
        )}
      </C.Content>

      <SideBar
        loading={loading}
        handleEnhanceImages={handleEnhanceImages}
        pendingImages={images.filter((item) => !item.enhancedPath)}
        handleModelChange={handleModelChange}
        selectedModel={selectedModel}
        selectedFolder={selectedFolder}
        handleSelectFolder={handleSelectFolder}
      />
    </C.Container>
  );
}

export default App;


