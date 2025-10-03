const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.static("public"));
app.use(bodyParser.json());

const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL UNIQUE,
            email TEXT,
            telefone TEXT,
            logradouro VARCHAR(50) NOT NULL,
            numero VARCHAR(5) NOT NULL,
            complemento VARCHAR(20),
            bairro VARCHAR(30) NOT NULL,
            cidade VARCHAR(20) NOT NULL,
            estado VARCHAR(2) NOT NULL,
            cep VARCHAR(9) NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS fornecedores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cnpj TEXT NOT NULL UNIQUE,
            telefone TEXT,
            email TEXT,
            cep VARCHAR(9) NOT NULL,
            logradouro VARCHAR(50) NOT NULL,
            numero VARCHAR(5) NOT NULL,
            complemento VARCHAR(20),
            bairro VARCHAR(30) NOT NULL,
            cidade VARCHAR(20) NOT NULL,
            estado VARCHAR(2) NOT NULL,
            contatoNome VARCHAR(50) NOT NULL,
            contatoCargo VARCHAR(50) NOT NULL,
            contatoTelefone VARCHAR(15) NOT NULL,
            contatoEmail VARCHAR(50) NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS produto(
            prod_id_seq INTEGER PRIMARY KEY AUTOINCREMENT,
            forn_id INTEGER,
            prod_nome VARCHAR(50) NOT NULL,
            prod_codigo_barra VARCHAR(20) NOT NULL,
            prod_categoria VARCHAR(30) NOT NULL,
            prod_estoque_atual INTEGER NOT NULL,
            prod_quantidade_minima INTEGER NOT NULL,
            prod_preco_anterior DECIMAL(10,2) NOT NULL,
            prod_preco_atual DECIMAL(10,2) NOT NULL,
            prod_preco_medio DECIMAL(10,2) NOT NULL,
            prod_data_cadastro DATE NOT NULL,
            prod_lote VARCHAR(10) NOT NULL,
            prod_fornecedor VARCHAR(50) NOT NULL,
            prod_descricao TEXT NOT NULL,
            FOREIGN KEY (forn_id) REFERENCES fornecedores(id)
        )
    `);    

    db.run(`
        CREATE TABLE IF NOT EXISTS funcionario(
        func_id INTEGER PRIMARY KEY AUTOINCREMENT,
        func_nome VARCHAR(100) NOT NULL,
        func_cpf VARCHAR(14) NOT NULL UNIQUE,
        func_email VARCHAR(100) NOT NULL,
        func_telefone VARCHAR(15) NOT NULL,
        func_logradouro VARCHAR(50) NOT NULL,
        func_numero VARCHAR(5) NOT NULL,
        func_complemento VARCHAR(20),
        func_bairro VARCHAR(30) NOT NULL,
        func_cidade VARCHAR(20) NOT NULL,
        func_estado VARCHAR(2) NOT NULL,
        func_cep VARCHAR(9) NOT NULL,
        func_cargo VARCHAR(50) NOT NULL,
        func_salario DECIMAL(10,2) NOT NULL
            )
    `);

       db.run(`
            CREATE TABLE IF NOT EXISTS venda (
            venda_id INTEGER PRIMARY KEY AUTOINCREMENT,
            cli_id INTEGER NOT NULL,
            func_id INTEGER NOT NULL, 
            venda_valor DECIMAL(10, 2) NOT NULL,
            venda_produto TEXT NOT NULL,
            venda_funcionario TEXT NOT NULL,
            venda_forma_pagamento TEXT NOT NULL,
            venda_data DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            venda_total DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (cli_id) REFERENCES clientes(id),
            FOREIGN KEY (func_id) REFERENCES funcionario(func_id)
            )
    `);

        db.run(`
            CREATE TABLE IF NOT EXISTS cliente_movimento (
            cli_mov_id INTEGER PRIMARY KEY AUTOINCREMENT,
            cli_id INTEGER NOT NULL,
            func_id INTEGER,
            cli_mov_tipo TEXT NOT NULL,
            cli_mov_descricao TEXT NOT NULL,
            cli_mov_valor DECIMAL(10, 2) NOT NULL,
            cli_mov_data DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            cli_mov_forma_pagamento TEXT NOT NULL,
            cli_mov_documento TEXT NOT NULL,
            cli_mov_status TEXT NOT NULL,
            FOREIGN KEY (cli_id) REFERENCES clientes(id),
            FOREIGN KEY (func_id) REFERENCES funcionario(func_id)
            )
     `);

    console.log("Tabelas criadas com sucesso.");
});

// Rota para cadastrar um novo cliente
app.post("/clientes", (req, res) => {
    const { nome, cpf, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;

    if (!nome || !cpf) {
        return res.status(400).json({ message: "Nome e CPF são obrigatórios." });
    }

    const query = `INSERT INTO clientes (nome, cpf, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [nome, cpf, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao cadastrar cliente...' });
        }
        res.status(201).json({ id: this.lastID, message: 'Cliente cadastrado com sucesso.' });
    });
});

// Rota para buscar clientes por CPF
app.get('/clientes', (req, res) => {
    const cpf = req.query.cpf || '';

    if (cpf) {
        const query = `SELECT * FROM clientes WHERE cpf LIKE ?`;
        db.all(query, [`%${cpf}%`], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar clientes...' });
            }
            res.json(rows);
        });
    } else {
        const query = `SELECT * FROM clientes`;
        db.all(query, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar clientes...' });
            }
            res.json(rows);
        });
    }
});

// Rota para cadastrar um novo funcionario
app.post("/funcionario", (req, res) => {
    const { func_nome, func_cpf, func_email, func_telefone, func_logradouro, func_numero, func_complemento, func_bairro, func_cidade, func_estado, func_cep, func_cargo, func_salario } = req.body;

    if (!func_nome || !func_cpf) {
        return res.status(400).json({ message: "Nome e CPF são obrigatórios." });
    }

    const query = `INSERT INTO funcionario (func_nome, func_cpf, func_email, func_telefone, func_logradouro, func_numero, func_complemento, func_bairro, func_cidade, func_estado, func_cep, func_cargo, func_salario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [func_nome, func_cpf, func_email, func_telefone, func_logradouro, func_numero, func_complemento, func_bairro, func_cidade, func_estado, func_cep, func_cargo, func_salario], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao cadastrar funcionario...' });
        }
        res.status(201).json({ id: this.lastID, message: 'Funcionario cadastrado com sucesso.' });
    });
});

// Rota para buscar funcionario por CPF
app.get('/funcionarios', (req, res) => {
    const cpf = req.query.cpf || '';

    if (cpf) {
        const query = `SELECT * FROM funcionario WHERE func_cpf LIKE ?`;
        db.all(query, [`%${cpf}%`], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar funcionario...' });
            }
            res.json(rows);
        });
    } else {
        const query = `SELECT * FROM funcionario`;
        db.all(query, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar funcionario...' });
            }
            res.json(rows);
        });
    }
});

// Rota para atualizar um cliente por CPF
app.put('/clientes/cpf/:cpf', (req, res) => {
    const { cpf } = req.params;
    const { nome, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;

    const query = `UPDATE clientes SET nome = ?, email = ?, telefone = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, cep = ? WHERE cpf = ?`;

    db.run(query, [nome, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep, cpf], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao atualizar cliente...' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado...' });
        }
        res.json({ message: 'Cliente atualizado com sucesso.' });
    });
});

// Rota para cadastrar um novo fornecedor
app.post("/fornecedores", (req, res) => {
    const { nome, cnpj, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, contatoNome, contatoCargo, contatoTelefone, contatoEmail } = req.body;

    if (!nome || !cnpj) {
        return res.status(400).json({ message: "Nome e CNPJ são obrigatórios." });
    }

    const query = `INSERT INTO fornecedores (nome, cnpj, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, contatoNome, contatoCargo, contatoTelefone, contatoEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [nome, cnpj, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, contatoNome, contatoCargo, contatoTelefone, contatoEmail], function (err) {
        if (err) {
            console.error("Erro ao cadastrar fornecedor:", err);
            return res.status(500).json({ message: 'Erro ao cadastrar fornecedor...' });
        }
        res.status(201).json({ id: this.lastID, message: 'Fornecedor cadastrado com sucesso.' });
    });
});

// Rota para buscar fornecedores por CNPJ
app.get('/fornecedores', (req, res) => {
    const cnpj = req.query.cnpj || '';

    if (cnpj) {
        const query = `SELECT * FROM fornecedores WHERE cnpj LIKE ?`;
        db.all(query, [`%${cnpj}%`], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar fornecedores...' });
            }
            res.json(rows);
        });
    } else {
        const query = `SELECT * FROM fornecedores`;
        db.all(query, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar fornecedores...' });
            }
            res.json(rows);
        });
    }
});

// Rota para atualizar um fornecedor por CNPJ
app.put('/fornecedores/cnpj/:cnpj', (req, res) => {
    const { cnpj } = req.params;
    const { nome, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, contatoNome, contatoCargo, contatoTelefone, contatoEmail } = req.body;

    const query = `UPDATE fornecedores SET nome = ?, telefone = ?, email = ?, cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, contatoNome = ?, contatoCargo = ?, contatoTelefone = ?, contatoEmail = ? WHERE cnpj = ?`;

    db.run(query, [nome, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, contatoNome, contatoCargo, contatoTelefone, contatoEmail, cnpj], function (err) {
        if (err) {
            console.error("Erro ao atualizar fornecedor:", err);
            return res.status(500).json({ message: 'Erro ao atualizar fornecedor...' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Fornecedor não encontrado...' });
        }
        res.json({ message: 'Fornecedor atualizado com sucesso.' });
    });
});

// Rota para cadastrar um novo produto
app.post("/produto", (req, res) => {
    const { nome, codigo, categoria, estoque_atual, quantidade_minima, preco_anterior, preco_atual, preco_medio, data_cadastro, lote, fornecedor, descricao } = req.body;

    if (!nome || !codigo) {
        return res.status(400).json({ message: "Nome e código são obrigatórios." });
    }

    const query = `INSERT INTO produto (prod_nome, prod_codigo_barra, prod_categoria, prod_estoque_atual, prod_quantidade_minima, prod_preco_anterior, prod_preco_atual, prod_preco_medio, prod_data_cadastro, prod_lote, prod_fornecedor, prod_descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [nome, codigo, categoria, estoque_atual, quantidade_minima, preco_anterior, preco_atual, preco_medio, data_cadastro, lote, fornecedor, descricao], function (err) {
        if (err) {
            console.error("Erro ao cadastrar produto:", err);
            return res.status(500).json({ message: 'Erro ao cadastrar produto...' });
        }
        res.status(201).json({ id: this.lastID, message: 'Produto cadastrado com sucesso.' });
    });
});

// Rota para buscar produtos por código
app.get('/produtos', (req, res) => {
    const codigo = req.query['produto-codigo'] || '';

    if (codigo) {
        const query = `SELECT * FROM produto WHERE prod_codigo_barra LIKE ?`;
        db.all(query, [`%${codigo}%`], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar produtos...' });
            }
            res.json(rows);
        });
    } else {
        const query = `SELECT * FROM produto`;
        db.all(query, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao buscar produtos...' });
            }
            res.json(rows);
        });
    }
});

// ROTA PARA VENDAS - VERSÃO RESUMIDA
app.post("/vendas", (req, res) => {
    const { cliente_cpf, itens } = req.body;

    if (!cliente_cpf || !itens?.length) {
        return res.status(400).json({ message: "CPF e itens são obrigatórios." });
    }

    // Buscar cliente com formatação flexível
    const cpfLimpo = cliente_cpf.replace(/\D/g, '');
    const queryCliente = `SELECT id, nome FROM clientes WHERE 
        cpf = ? OR REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?`;

    db.get(queryCliente, [cliente_cpf, cpfLimpo], (err, cliente) => {
        if (err || !cliente) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }

        // Buscar produtos
        const produtoIds = itens.map(item => item.idProduto);
        const placeholders = produtoIds.map(() => '?').join(',');

        db.all(`SELECT prod_id_seq, prod_nome, prod_estoque_atual, prod_preco_atual 
                FROM produto WHERE prod_id_seq IN (${placeholders})`, produtoIds, (err, produtos) => {

            if (err || produtos.length !== itens.length) {
                return res.status(404).json({ message: "Produto(s) não encontrado(s)." });
            }

            // Validar estoque e calcular total
            let valorTotal = 0;
            for (let item of itens) {
                const produto = produtos.find(p => p.prod_id_seq === item.idProduto);
                if (produto.prod_estoque_atual < item.quantidade) {
                    return res.status(400).json({ message: `Estoque insuficiente: ${produto.prod_nome}` });
                }
                valorTotal += produto.prod_preco_atual * item.quantidade;
            }

            // Inserir venda
            const produtosNomes = produtos.map(p => p.prod_nome).join(', ');
            const insertVenda = `INSERT INTO venda (cli_id, func_id, venda_valor, venda_produto, venda_funcionario, venda_forma_pagamento, venda_total) VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db.run(insertVenda, [cliente.id, 1, valorTotal, produtosNomes, 'Sistema', 'Dinheiro', valorTotal], function(err) {
                if (err) {
                    return res.status(500).json({ message: "Erro ao processar venda." });
                }

                // Atualizar estoque
                for (let item of itens) {
                    const produto = produtos.find(p => p.prod_id_seq === item.idProduto);
                    const novoEstoque = produto.prod_estoque_atual - item.quantidade;
                    db.run("UPDATE produto SET prod_estoque_atual = ? WHERE prod_id_seq = ?", [novoEstoque, item.idProduto]);
                }

                res.status(201).json({ message: "Venda realizada com sucesso!", valorTotal });
            });
        });
    });
});

// Rota para buscar vendas
app.get('/vendas', (req, res) => {
    const vendaId = req.query.venda_id || '';

    if (vendaId) {
        const query = `SELECT * FROM venda WHERE venda_id = ? ORDER BY venda_data DESC`;
        db.all(query, [vendaId], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar venda:', err);
                return res.status(500).json({ message: 'Erro ao buscar venda.' });
            }
            res.json(rows);
        });
    } else {
        const query = `SELECT * FROM venda ORDER BY venda_data DESC`;
        db.all(query, (err, rows) => {
            if (err) {
                console.error('Erro ao buscar vendas:', err);
                return res.status(500).json({ message: 'Erro ao buscar vendas.' });
            }
            res.json(rows);
        });
    }
});

app.get('/', (_req, res) => {
    res.send('Servidor está rodando e tabelas criadas!');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});