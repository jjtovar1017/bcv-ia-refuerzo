import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

export async function optimizarCodigoJS(codigo) {
  try {
    const response = await ollama.generate({
      model: "phi3",
      prompt: `[SYS] Eres un ingeniero senior de JavaScript [/SYS]
               [USER] Optimiza este código:\n\`\`\`javascript\n${codigo}\n\`\`\`[/USER]`
    });
    
    return {
      optimizado: response.response,
      original: codigo,
      exito: true
    };
  } catch (error) {
    return {
      optimizado: codigo,
      original: codigo,
      exito: false,
      error: error.message
    };
  }
}
