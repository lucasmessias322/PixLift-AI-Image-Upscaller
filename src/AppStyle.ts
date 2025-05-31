import styled from "styled-components";


 export const Container = styled.div`
  display: flex;
  height: 100vh;
`;

export const Content = styled.div`
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const DropZone = styled.div`
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
export const FileInput = styled.input`
  margin-top: 20px;
`;
export const Gallery = styled.div`
  padding: 20px;
  h2 {
    padding: 10px;
    color: #af4dff;
  }
`;

export const ImagesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const ImageWrapper = styled.div<{ isBeingUpscaled: boolean }>`
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

export const ImageProgreesBar = styled.div`
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

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;

  /* border-radius: 5px; */
  ///padding: 5px;
  /* border: 2px solid #6e00c9; */
  filter: opacity(0.1);
`;

export const RemoveButton = styled.button`
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

export const ImageConvertedWrapper = styled.div`
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

export const ImageConverted = styled.img`
  width: 100%;
  height: 100%;

  object-fit: cover;
  /* border: 5px solid white;
  border-left: 2px solid white;
  border-right: 2px solid white; */
`;
