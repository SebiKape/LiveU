const TYPES = require('tedious').TYPES;

async function insertIntoDB(Api_res_string, inputs, tp){
    try {
        nome_cod = Api_res_string[1];
        sobrenome_cod = Api_res_string[3];
        email_cod = Api_res_string[5];
        // Insert nome, nome_cod into table tbs_nome
        sqlString = `INSERT INTO tbs_nome (nome, cod)
            VALUES (@nome,@nome_cod)`;
        nome_cod_id = await tp.sql(sqlString)
                        .parameter('nome', TYPES.VarChar, inputs.nome)
                        .parameter('nome_cod', TYPES.BigInt, nome_cod)
                        .execute();

        // Insert sobrenome, sobrenome_cod into table tbs_sobrenome
        sqlString = `INSERT INTO tbs_sobrenome (sobrenome, cod)
            VALUES (@sobrenome,@sobrenome_cod)`;
        sobrenome_cod_id = await tp.sql(sqlString)
                            .parameter('sobrenome', TYPES.VarChar, inputs.sobrenome)
                            .parameter('sobrenome_cod', TYPES.BigInt, sobrenome_cod)
                            .execute();

        //Insert email, email_cod into table tbs_email
        sqlString = `INSERT INTO tbs_email (email, cod)
            VALUES (@email,@email_cod)`;
        email_cod_id = await tp.sql(sqlString)
                        .parameter('email', TYPES.VarChar, inputs.email)
                        .parameter('email_cod', TYPES.BigInt, email_cod)
                        .execute();

    } catch (error) {
        console.error(error);
    };
};

async function select_code_and_sum(Api_res_string, tp) {
    nome_cod = Api_res_string[1];
    sobrenome_cod = Api_res_string[3];
    email_cod = Api_res_string[5];
    let queryResult = [];
    let soma = parseInt(nome_cod) + parseInt(sobrenome_cod) + parseInt(email_cod);
    // Get soma from tbs_cod_nome, tbs_cod_sobrenome and tbs_cod_email
    sqlString = `SELECT n.soma as soma_nome, s.soma as soma_sobrenome, e.soma as soma_email FROM tbs_cod_nome n
                 CROSS JOIN tbs_cod_sobrenome as s
                 CROSS JOIN tbs_cod_email as e
                 WHERE n.cod = @nome_cod
                 AND s.cod = @sobrenome_cod
                 AND e.cod = @email_cod
                 `;

    const timer = () => {
        return new Promise(res => {
            setTimeout(() => {
                res();
            }, 100);
        });
    };
    // will loop until gets a result or timeout after 15 attempts (1,5 secs)
    let i = 15;
    while ((queryResult == null || queryResult[0] == null ) && i > 0) {
        queryResult = await tp.sql(sqlString)
                .parameter('nome_cod', TYPES.BigInt, nome_cod)
                .parameter('sobrenome_cod', TYPES.BigInt, sobrenome_cod)
                .parameter('email_cod', TYPES.BigInt, email_cod)
                .execute();
        timer().then(() => {
            i -= 1
        });
    };

    if (queryResult != null && queryResult[0] != null) {
        soma += queryResult[0].soma_nome + queryResult[0].soma_sobrenome + parseInt(queryResult[0].soma_email);
    } else{
        console.log("sum error");
        return 0;
    };
    return soma;
};

async function get_animal_color_country(soma, tp){
    sqlString = `SELECT a.animal, c.cor, p.pais FROM (SELECT * FROM tbs_animais WHERE total = @total) a
                 INNER JOIN tbs_cores c ON c.total = a.total
                 INNER JOIN tbs_paises p ON p.total = a.total
                 LEFT JOIN tbs_cores_excluidas cex ON cex.cor = c.cor
                 WHERE cex.id IS NULL`;

    queryResult = await tp.sql(sqlString)
                    .parameter('total', TYPES.BigInt, soma)
                    .execute();
    return queryResult;
}

module.exports = {
    insertIntoDB,
    select_code_and_sum,
    get_animal_color_country
};