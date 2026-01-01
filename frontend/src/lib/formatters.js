/**
 * Formata número para moeda brasileira com ponto como separador de milhar
 * @param {number} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} - Valor formatado (ex: 1.234,56)
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,00';
  }
  
  // Converte para número e fixa decimais
  const num = parseFloat(value).toFixed(decimals);
  
  // Separa parte inteira e decimal
  const [intPart, decPart] = num.split('.');
  
  // Adiciona pontos como separador de milhar
  const intWithDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Retorna com vírgula como separador decimal
  return `${intWithDots},${decPart}`;
};

/**
 * Formata número para moeda brasileira completa com R$
 * @param {number} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} - Valor formatado (ex: R$ 1.234,56)
 */
export const formatBRL = (value, decimals = 2) => {
  return `R$ ${formatCurrency(value, decimals)}`;
};
