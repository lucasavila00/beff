FROM mcr.microsoft.com/devcontainers/javascript-node:1-18-bullseye

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

RUN npm install --global pnpm



ARG USERNAME=devu
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN useradd -ms /bin/bash $USERNAME

RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

USER $USERNAME


RUN echo 1
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/home/devu/.cargo/bin:${PATH}"
RUN cargo install wasm-pack
RUN cargo install cargo-insta



