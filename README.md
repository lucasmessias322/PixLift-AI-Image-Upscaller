# Real-ESRGAN Upscaler Electron

Este é um aplicativo desktop construído com [Electron](https://www.electronjs.org/) que permite realizar o upscale de imagens utilizando o Real-ESRGAN com aceleração via Vulkan. Com uma interface intuitiva de *drag and drop*, você pode aprimorar suas imagens, acompanhar o progresso em tempo real e comparar o resultado com a imagem original.

## Funcionalidades

- **Upscale de Imagens:** Aumente a resolução das suas imagens usando o modelo Real-ESRGAN.
- **Aceleração Vulkan:** Processamento otimizado com Vulkan para maior performance.
- **Interface de Drag and Drop:** Arraste e solte as imagens na área de trabalho para iniciar o processamento.
- **Progresso em Tempo Real:** Visualize o andamento do processamento com uma barra de progresso.
- **Comparação de Imagens:** Compare lado a lado a imagem original e a aprimorada por meio de um popup interativo.
- **Seleção de Pasta de Saída:** Escolha onde deseja salvar as imagens aprimoradas.

## Pré-requisitos

- **Node.js** (versão 14 ou superior recomendada)
- **npm** ou **Yarn**
- O executável do [Real-ESRGAN Vulkan](https://github.com/xinntao/Real-ESRGAN) (normalmente `realesrgan-ncnn-vulkan.exe`), que deve estar localizado na pasta `real-esrgan` dentro do diretório raiz do projeto.

## Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/lucasmessias322/PixLift-AI-Image-Upscaller.git
   cd real-esrgan-upscaler-electron
