const express = require('express')
const app = express()
const axios = require('axios')
const TYPES = require('tedious').TYPES
const tp = require('tedious-promises')

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))

const conConfig = {
    "userName": "user_trial",
    "password": "7412LIVE!@#$%¨&*()",
    "server": "virtual2.febracorp.org.br",
    "port": 1433,
    "options": {
      "database": "CONTOSO"
    }
  }

async function create_connection(){
    await tp.setConnectionConfig(conConfig)    
}

try {
    create_connection()
    console.log("connected")   
} catch (error) {
    console.error(error)
}

app.get('/', (req,res) => {
    res.render('formulario')
})

app.post('/', async (req,res) => {
    try {
        //get data from request
        nome = req.body.nome
        sobrenome = req.body.sobrenome
        email = req.body.email
        //convert data to urlencoded format
        let data = "nome="
        data = data.concat(nome,"&sobrenome=",sobrenome,"&email=",email)
        //send request to api
        Api_res = await axios({
            method: 'post',
            url: 'http://138.68.29.250:8082/',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data
        })
        Api_res_string = Api_res.data.split("#")
        // Api_res_string = "N#479#S#481#E#852#".split("#")
        // insert names and codes to database
        await insertIntoDB(Api_res_string, nome, sobrenome, email)
        // select data from code tables for sum calculation
        soma = await select_code_and_sum(Api_res_string)
        // console.log(soma)
        if (!soma) {
            return res.status(504).send('Desculpe, parece que nosso banco de dados está um pouco ocupado, tente novamente mais tarde');
        }
        // get animal, color and Country
        result = await get_animal_color_country(soma)
        // console.log(result)
        res.status(201).render('formulario', {
            result: result[0]
        })
    } catch (error) {
        console.error(error)
        res.redirect('/')
    }
})

async function insertIntoDB(Api_res_string, nome, sobrenome, email){
    try {
        nome_cod = Api_res_string[1]
        sobrenome_cod = Api_res_string[3]
        email_cod = Api_res_string[5]
        // Insert nome, nome_cod into table tbs_nome
        sqlString = `INSERT INTO tbs_nome (nome, cod)
            VALUES (@nome,@nome_cod); SELECT @@identity as id`
        nome_cod_id = await tp.sql(sqlString)
                        .parameter('nome', TYPES.VarChar, nome)
                        .parameter('nome_cod', TYPES.BigInt, nome_cod)
                        .execute()

        // Insert sobrenome, sobrenome_cod into table tbs_sobrenome
        sqlString = `INSERT INTO tbs_sobrenome (sobrenome, cod)
            VALUES (@sobrenome,@sobrenome_cod); SELECT @@identity as id`
        sobrenome_cod_id = await tp.sql(sqlString)
                            .parameter('sobrenome', TYPES.VarChar, sobrenome)
                            .parameter('sobrenome_cod', TYPES.BigInt, sobrenome_cod)
                            .execute()

        //Insert email, email_cod into table tbs_email
        sqlString = `INSERT INTO tbs_email (email, cod)
            VALUES (@email,@email_cod); SELECT @@identity as id`
        email_cod_id = await tp.sql(sqlString)
                        .parameter('email', TYPES.VarChar, email)
                        .parameter('email_cod', TYPES.BigInt, email_cod)
                        .execute()

        return {
            nome_cod_id,
            sobrenome_cod_id,
            email_cod_id
        }

    } catch (error) {
        console.error(error)
    }
}

async function select_code_and_sum(Api_res_string) {
    nome_cod = Api_res_string[1]
    sobrenome_cod = Api_res_string[3]
    email_cod = Api_res_string[5]
    let queryResult = []
    let soma = parseInt(nome_cod) + parseInt(sobrenome_cod) + parseInt(email_cod)
    // Get soma from tbs_cod_nome, tbs_cod_sobrenome and tbs_cod_email
    sqlString = `SELECT n.soma as soma_nome, s.soma as soma_sobrenome, e.soma as soma_email FROM tbs_cod_nome n
                 CROSS JOIN tbs_cod_sobrenome as s
                 CROSS JOIN tbs_cod_email as e
                 WHERE n.cod = @nome_cod
                 AND s.cod = @sobrenome_cod
                 AND e.cod = @email_cod
                 `

    const timer = () => {
        return new Promise(res => {
            setTimeout(() => {
                res();
            }, 100);
        });
    }
    // will loop until gets a result or timeout after 15 attempts (1,5 secs)
    let i = 15
    while ((queryResult == null || queryResult[0] == null ) && i > 0) {
        queryResult = await tp.sql(sqlString)
                .parameter('nome_cod', TYPES.BigInt, nome_cod)
                .parameter('sobrenome_cod', TYPES.BigInt, sobrenome_cod)
                .parameter('email_cod', TYPES.BigInt, email_cod)
                .execute()
        timer().then(() => {
            i -= 1
        })
    }

    if (queryResult != null && queryResult[0] != null) {
        soma += queryResult[0].soma_nome + queryResult[0].soma_sobrenome + parseInt(queryResult[0].soma_email)
    } else{
        console.log("sum error")
        return 0
    }
    return soma
}

async function get_animal_color_country(soma){
    sqlString = `SELECT a.animal, c.cor, p.pais FROM (SELECT * FROM tbs_animais WHERE total = @total) a
                 INNER JOIN tbs_cores c ON c.total = a.total
                 INNER JOIN tbs_paises p ON p.total = a.total
                 LEFT JOIN tbs_cores_excluidas cex ON cex.cor = c.cor
                 WHERE cex.id IS NULL`

    queryResult = await tp.sql(sqlString)
                    .parameter('total', TYPES.BigInt, soma)
                    .execute()
    return queryResult
}

app.listen(process.env.PORT || 4000)
