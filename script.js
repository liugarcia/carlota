 import { createWeb3Modal, defaultWagmiConfig } from "https://esm.sh/@web3modal/wagmi@5.0.11/?bundle";
        import { bscTestnet } from "https://esm.sh/@wagmi/core@2.13.1/chains?exports=bscTestnet";

        const projectId = "ea82e406480d9d8f524c7fe5c20cd367"; // Substitua por seu verdadeiro projectId

        const metadata = {
            name: "carlota",
            description: "",
            url: "", // origin must match your domain & subdomain
            icons: ["https://avatars.githubusercontent.com/u/37784886"],
        };

        const chains = [bscTestnet];

        const config = defaultWagmiConfig({
            chains,
            projectId,
            metadata,
        });

        const modal = createWeb3Modal({
            wagmiConfig: config,
            projectId,
        });

        modal.subscribeEvents((newState) => {
            if (newState.data && newState.data.event) {
                console.log("events", newState.data.event);
            }
            if (newState.data.event === 'openModal') {
                console.log("Modal aberto:", newState);
            }
        });

        function isMobileDevice() {
            return /Mobi|Android/i.test(navigator.userAgent);
        }

        function openWalletApp(walletName) {
            const urls = {
                MetaMask: 'https://metamask.app.link',
                TrustWallet: 'https://trustwallet.com',
                Coinbase: 'https://wallet.coinbase.com',
            };

            const url = urls[walletName];
            if (url) {
                window.open(url, '_blank');
            } else {
                console.error(`URL para o aplicativo ${walletName} não encontrada.`);
            }
        }

        document.addEventListener('DOMContentLoaded', (event) => {
            const button = document.querySelector('w3m-button');
            const publishButton = document.getElementById('publish');
            const statusTextarea = document.getElementById('status');

            if (button) {
                button.classList.add('active');

                if (isMobileDevice()) {
                    console.log("Usuário em um dispositivo móvel.");
                    // Tente abrir o aplicativo correspondente
                    openWalletApp('MetaMask'); // Inicia com MetaMask
                } else {
                    console.log("Usuário em um navegador web.");
                    // Adicione lógica específica para navegadores web aqui
                }
            } else {
                console.error("Elemento 'w3m-button' não encontrado.");
            }

            if (publishButton && statusTextarea) {
                publishButton.addEventListener('click', () => {
                    const statusText = statusTextarea.value;
                    console.log("Status publicado:", statusText);
                    // Aqui você pode adicionar lógica para enviar a mensagem para a blockchain
                });
            } else {
                console.error("Elemento 'publish' ou 'status' não encontrado.");
            }
        });
    </script>
    <script>
        let web3;
        let account;
        const contractAddress = '0x0dab011a9bf93cb45ad846dd9ca3e09261923aa3'; // Endereço do contrato fornecido
        const contractABI = [
            {
                "anonymous": false,
                "inputs": [
                    { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
                    { "indexed": false, "internalType": "string", "name": "text", "type": "string" },
                    { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
                ],
                "name": "NewMessage",
                "type": "event"
            },
            {
                "inputs": [],
                "name": "getMessages",
                "outputs": [
                    {
                        "components": [
                            { "internalType": "address", "name": "user", "type": "address" },
                            { "internalType": "string", "name": "text", "type": "string" },
                            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
                        ],
                        "internalType": "struct SocialDApp.Message[]",
                        "name": "",
                        "type": "tuple[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    { "internalType": "uint256", "name": "", "type": "uint256" }
                ],
                "name": "messages",
                "outputs": [
                    { "internalType": "address", "name": "user", "type": "address" },
                    { "internalType": "string", "name": "text", "type": "string" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    { "internalType": "string", "name": "_text", "type": "string" }
                ],
                "name": "publishStatus",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        async function loadWeb3() {
            if (window.ethereum) {
                web3 = new Web3(window.ethereum);
                console.log('Web3 instance created');
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    console.log('MetaMask is connected');
                    const accounts = await web3.eth.getAccounts();
                    if (accounts.length > 0) {
                        account = accounts[0];
                        document.getElementById('account').innerText = `Connected Account: ${account}`;
                        document.getElementById('connect').style.display = 'none';
                        document.getElementById('disconnect').style.display = 'block';
                    } else {
                        console.log('No accounts found');
                    }
                } catch (error) {
                    console.error('User denied account access', error);
                }
            } else {
                alert("Please install MetaMask to use this DApp!");
            }
        }

        async function connectWallet() {
            if (!window.ethereum) {
                alert("MetaMask is not installed. Please install it and try again.");
                return;
            }

            try {
                const accounts = await web3.eth.getAccounts();
                if (accounts.length > 0) {
                    account = accounts[0];
                    document.getElementById('account').innerText = `Connected Account: ${account}`;
                    document.getElementById('connect').style.display = 'none';
                    document.getElementById('disconnect').style.display = 'block';
                    localStorage.setItem('account', account); // Salvar conta no localStorage
                    console.log('Connected account:', account);
                } else {
                    console.log('No accounts found');
                }
            } catch (error) {
                console.error('Error connecting wallet:', error);
            }
        }

        function disconnectWallet() {
            account = null;
            document.getElementById('account').innerText = '';
            document.getElementById('connect').style.display = 'block';
            document.getElementById('disconnect').style.display = 'none';
            localStorage.removeItem('account'); // Remover conta do localStorage
            console.log('Wallet disconnected');
        }

        async function publishStatus() {
            const statusInput = document.getElementById('status');
            const status = statusInput.value;
            
            if (!account) {
                alert('Please connect your wallet first.');
                return;
            }
            
            if (status.trim()) {
                const contract = new web3.eth.Contract(contractABI, contractAddress);
                try {
                    console.log('Publishing status:', status);
                    await contract.methods.publishStatus(status).send({ from: account });
                    
                    // Limpa a caixa de texto
                    statusInput.value = '';

                    // Recarregar as mensagens
                    loadMessages();
                } catch (error) {
                    console.error('Error publishing status:', error);
                }
            } else {
                alert('Please enter a status.');
            }
        }

        async function loadMessages() {
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            try {
                const messages = await contract.methods.getMessages().call();
                const feedElement = document.getElementById('feed');
                feedElement.innerHTML = '';
                for (const message of messages) {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message');
                    messageElement.innerHTML = `
                        <p><strong>${message.user}</strong>: ${message.text}</p>
                        <p><small>${new Date(message.timestamp * 1000).toLocaleString()}</small></p>
                    `;
                    feedElement.appendChild(messageElement);
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadWeb3();
            const savedAccount = localStorage.getItem('account');
            if (savedAccount) {
                account = savedAccount;
                document.getElementById('account').innerText = `Connected Account: ${account}`;
                document.getElementById('connect').style.display = 'none';
                document.getElementById('disconnect').style.display = 'block';
                console.log('Account restored from localStorage:', account);
            }
            document.getElementById('connect').addEventListener('click', connectWallet);
            document.getElementById('disconnect').addEventListener('click', disconnectWallet);
            document.getElementById('publish').addEventListener('click', publishStatus);
            loadMessages();
        });
