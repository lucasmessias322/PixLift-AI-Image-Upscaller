import React, { useCallback, useState } from "react";
import styled from "styled-components";

interface sidebar {
  loading: boolean;
  handleEnhanceImages: any;
  originalImages: any;
}

export default function SideBar({
  loading,
  handleEnhanceImages,
  originalImages,
}: sidebar) {
  return (
    <Container>
      <LogoContainer>
        <h2 className="logo">PixLift</h2>
        <span>AI Image Upscaller </span>
      </LogoContainer>

      <ConfigsContainer>
        <SelectorWrapper>
          <label htmlFor="">Selecione um modelo de IA</label>
          <Selector name="Models" id="models">
            <option value="Real-ESRGAN">Real-ESRGAN</option>
            {/* <option value="saab">Saab</option>
            <option value="opel">Opel</option>
            <option value="audi">Audi</option> */}
          </Selector>
        </SelectorWrapper>

        <SelectorWrapper>
          <label htmlFor="">Placa de video</label>
          <Selector name="Models" id="models">
            <option value="amd">AMD</option>
            <option value="nvidea">NVIDIA</option>
            <option value="opel">Sem placa de video</option>
            
          </Selector>
        </SelectorWrapper>

        <EnhanceButton
          onClick={handleEnhanceImages}
          disabled={loading || originalImages.length === 0}
        >
          {loading ? "Upscaling..." : "Upscale Images"}
        </EnhanceButton>
      </ConfigsContainer>
    </Container>
  );
}

const Container = styled.div`
  width: 40%;
  max-width: 300px;
  height: 100vh;
  padding: 10px 20px;
  background-color: #252525;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  .logo {
    font-size: 30px;
    color: #ffffff;
    text-align: center;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
// const ConfigsContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   margin-top: 20px;
// `;
// const EnhanceButton = styled.button`
//   // max-width: 100px;
//   background-color: ${({ disabled }) => (disabled ? "#4f008f57" : "#6e00c9")};
//   color: ${({ disabled }) => (disabled ? "#cccccc" : "white")};
//   padding: 10px 5px;
//   border: none;
//   border-radius: 10px;
//   font-weight: bold;
//   font-size: 16px;
//   cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};

//   &:hover {
//     background-color: ${({ disabled }) => (disabled ? "#4F008F80" : "#5a5eff")};
//   }


//`;

const ConfigsContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  flex: 1; // Ocupa todo o espaço disponível, empurrando o botão para baixo
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

