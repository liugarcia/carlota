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
        console.log('Loading messages...');
        const messages = await contract.methods.getMessages().call();
        
        const feed = document.getElementById('feed');
        feed.innerHTML = '';
        messages.forEach(message => {
            const timestamp = Number(message.timestamp);
            const date = new Date(timestamp * 1000);
            const div = document.createElement('div');
            div.className = 'feed-item';
            if (message.user.toLowerCase() === account.toLowerCase()) {
                div.classList.add('right');
            } else {
                div.classList.add('left');
            }
            div.innerHTML = 
                `<b>${message.user}</b><br>
                <span>${message.text}</span><br>
                <small class="timestamp">${date.toLocaleString()}</small>`;
            feed.appendChild(div);
        });

        feed.scrollTop = feed.scrollHeight;

        console.log('Messages loaded:', messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadWeb3();

    const savedAccount = localStorage.getItem('account');
    if (savedAccount) {
        account = savedAccount;
        document.getElementById('account').innerText = `Connected Account: ${account}`;
        document.getElementById('connect').style.display = 'none';
        document.getElementById('disconnect').style.display = 'block';
        loadMessages();
    }
});

document.getElementById('connect').addEventListener('click', connectWallet);
document.getElementById('disconnect').addEventListener('click', disconnectWallet);
document.getElementById('publish').addEventListener('click', publishStatus);
