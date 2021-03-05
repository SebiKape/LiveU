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

// async function select_from_db(){
//     sqlString = "SELECT email FROM tbs_email WHERE id = @id"
    
//     result = await execute_query(sqlString)
//     console.log(result)
// }

// try {
//     select_from_db()
// } catch (error) {
//     console.log(error)
// }

app.get('/', (req,res) => {
    res.render('formulario')
})

app.post('/', async (req,res) => {
    try {
        nome = req.body.nome
        sobrenome = req.body.sobrenome
        email = req.body.email
        let data = "nome="
        data = data.concat(nome,"&sobrenome=",sobrenome,"&email=",email)
        Api_res = await axios({
            method: 'post',
            url: 'http://138.68.29.250:8082/',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data
        })
        Api_res_string = Api_res.data.split("#")
        
        output_ids = await insertIntoDB(Api_res_string, nome, sobrenome, email)
        console.log(output_ids)
        check = await check_data(output_ids, nome, sobrenome, email) 

        res.redirect('/')
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
            OUTPUT INSERTED.id
            VALUES (@nome,@nome_cod)`
        nome_cod_id = await tp.sql(sqlString)
                        .parameter('nome', TYPES.VarChar, nome)
                        .parameter('nome_cod', TYPES.BigInt, nome_cod)
                        .execute()

        // Insert sobrenome, sobrenome_cod into table tbs_sobrenome
        sqlString = `INSERT INTO tbs_sobrenome (sobrenome, cod)
            OUTPUT INSERTED.id
            VALUES (@sobrenome,@sobrenome_cod)`
        sobrenome_cod_id = await tp.sql(sqlString)
                            .parameter('sobrenome', TYPES.VarChar, sobrenome)
                            .parameter('sobrenome_cod', TYPES.BigInt, sobrenome_cod)
                            .execute()

        //Insert email, email_cod into table tbs_email
        sqlString = `INSERT INTO tbs_email (email, cod)
            OUTPUT INSERTED.id
            VALUES (@email,@email_cod)`
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

async function check_data(output_ids, nome, sobrenome, email) {
    var check = false
    //verifica se foi realmente foram adicionados os dados no banco
    nome_cod_id = output_ids.nome_cod_id[0].id
    sobrenome_cod_id = output_ids.sobrenome_cod_id[0].id
    email_cod_id = output_ids.email_cod_id[0].id
    //Verifica table tbs_nome
    sqlString = "SELECT nome, cod from tbs_nome WHERE id = @id"
    queryResult = await tp.sql(sqlString)
                    .parameter('id', TYPES.Int, nome_cod_id)
                    .execute()
    if ( queryResult[0].nome != null) {
        if (queryResult[0].nome === nome) {
            check = true
        }
    }else {
        check = false
    }
    return check
     
    //Verifica table tbs_sobrenome
    sqlString = "SELECT sobrenome, cod from tbs_sobrenome WHERE id = @id"
    queryResult = await tp.sql(sqlString)
                    .parameter('id', TYPES.Int, sobrenome_cod_id)
                    .execute()
    //Verifica table email
    sqlString = "SELECT email, cod from tbs_email WHERE id = @id"
    queryResult = await tp.sql(sqlString)
                    .parameter('id', TYPES.Int, email_cod_id)
                    .execute()
}

app.listen(process.env.PORT || 4000)
