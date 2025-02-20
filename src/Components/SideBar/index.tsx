import styled from "styled-components";

interface sidebar {
  loading: boolean;
  handleEnhanceImages: any;
  pendingImages: any;
  selectedModel: string;
  handleModelChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  selectedFolder: any;
  handleSelectFolder: () => void;
}

export default function SideBar({
  loading,
  handleEnhanceImages,
  pendingImages,
  selectedModel,
  handleModelChange,
  handleSelectFolder,
  selectedFolder,
}: sidebar) {
  return (
    <Container>
      <LogoContainer>
        <h1>PixLift</h1>
        <span>AI Image Upscaller </span>
      </LogoContainer>

      <ConfigsContainer>
        <SelectorWrapper>
          <label htmlFor="">Select an AI model</label>
          <Selector
            name="Models"
            id="models"
            value={selectedModel}
            onChange={handleModelChange}
          >
            <option value="realesrgan-x4plus">realesrgan-x4plus</option>
            <option value="upscayl-lite-4x">upscayl-lite-4x</option>
            <option value="realesrgan-x4fast">realesrgan-x4fast</option>

            <option value="realesr-animevideov3-x4">
              realesr-animevideov3-x4
            </option>
            <option value="realesr-animevideov3-x4">
              realesr-animevideov3-x2
            </option>
          </Selector>
        </SelectorWrapper>

        <label htmlFor="">Select output folder</label>
        <SelectFolderBTN onClick={handleSelectFolder}>
          {selectedFolder ? selectedFolder : "Selecionar pasta de saida"}
        </SelectFolderBTN>

        <EnhanceButton
          onClick={handleEnhanceImages}
          disabled={
            loading || pendingImages.length === 0 || selectedModel == undefined
          }
        >
          {loading ? "Upscaling..." : "Upscale Images"}
        </EnhanceButton>
      </ConfigsContainer>
    </Container>
  );
}

const Container = styled.div`
  width: 35%;
  max-width: 300px;
  height: 100vh;
  padding: 10px 20px;
  background-color: #252525;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const Logo = styled.h1``;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  h1 {
    font-size: 35px;
    //padding: 10px;
    color: #af4dff;
    text-align: center;
  }
`;

const SelectorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 10px 0px;
`;

const Selector = styled.select`
  background-color: #2e2e2e;
  border: none;
  padding: 10px;
  border-radius: 10px;

  option {
    font-size: 16px;
  }
  margin: 5px 0px;
`;

const SelectFolderBTN = styled.button`
  background-color: #2e2e2e;
  border: none;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;

  &:hover {
    background-color: #414141;
  }
`;
const ConfigsContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  flex: 1; // Ocupa todo o espaço disponível, empurrando o botão para baixo

  label {
    font-size: 16px;
    padding: 10px 0px;
  }
`;

const EnhanceButton = styled.button`
  background-color: ${({ disabled }) => (disabled ? "#6f00c94e" : "#6e00c9")};
  color: ${({ disabled }) => (disabled ? "#cccccc" : "white")};
  padding: 10px 5px;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  font-size: 16px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  margin-top: auto; // Isso garante que ele fique no final da sidebar

  &:hover {
    background-color: ${({ disabled }) => (disabled ? "#4F008F80" : "#8c00ff")};
  }
`;
