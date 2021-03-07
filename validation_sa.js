function validate(inputs) {
    let errorMessage = "";
    if (!inputs.nome || !inputs.sobrenome || !inputs.email){
        //something is missing from request
        errorMessage = "Erro ao obter os dados. Todos campos são obrigatórios";
        return {
            check: false,
            errorMessage
        };
    };
    const regex = /\S+@\S/;
    if (!regex.test(inputs.email)){
        errorMessage = "Erro ao obter os dados. Formato de e-mail incorreto";
        return {
            check: false,
            errorMessage
        };
    };
    return {
        check: true,
        errorMessage
    };
};

function sanitize(inputs) {
    //remove blanks before and after; escape to avoid xss attacks
    inputs.nome = escape(inputs.nome.replace(/(^\s+|\s+$)/g, ""));
    inputs.sobrenome = escape(inputs.sobrenome.replace(/(^\s+|\s+$)/g, ""));
    inputs.email = escape(inputs.email.replace(/(^\s+|\s+$)/g, ""));
    return inputs;
}

module.exports = {
    validate,
    sanitize
};