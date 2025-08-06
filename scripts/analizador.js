import { Ollama } from 'ollama';

const ollama = new Ollama({ 
  host: 'http://localhost:11434',
  timeout: 120000  // Aumenta timeout si es necesario
});

async function optimizarCodigo(codigo) {
  try {
    const response = await ollama.generate({
      model: "phi3",
      prompt: `[SYS] Eres un ingeniero senior de JavaScript [/SYS]
               [USER] Optimiza este código:\n\`\`\`javascript\n${codigo}\n\`\`\`[/USER]`
    });
    return response.response;
  } catch (error) {
    console.error("Error en Ollama:", error);
    return "Error procesando la solicitud";
  }
}

const codigoOriginal = `
function sumarArray(arr) {
  let total = 0;
  for(let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}
`;

optimizarCodigo(codigoOriginal)
  .then(resultado => console.log("Código optimizado:\n", resultado))
  .catch(error => console.error("Error general:", error));
