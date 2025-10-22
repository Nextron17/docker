import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno al principio

// Importa el servidor HTTP y la app Express desde server.ts
import { server } from './server';
// Importa la instancia de Sequelize desde tu archivo de configuración de base de datos
import { sequelize } from './config/db';

// Muestra variables importantes al inicio (útil para depurar)
console.log('--- Variables de Entorno Cargadas ---');
console.log('PORT:', process.env.PORT || '(usando default 4000)');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Cargada' : 'NO CARGADA');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Cargado' : 'NO CARGADO');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Cargado' : 'NO CARGADO');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Cargada' : 'NO CARGADA');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('------------------------------------');


const port = process.env.PORT || 4000;

async function startServer() {
    try {
        console.log('>>> [1/4] Intentando autenticar con la base de datos...'); // Log 1
        await sequelize.authenticate();
        console.log('✅ [2/4] Conexión a la base de datos establecida exitosamente.'); // Log 2

        console.log('>>> [3/4] Intentando sincronizar modelos...'); // Log 3
        // Usar alter: true solo si necesitas que Sequelize modifique las tablas existentes
        // Usar force: true BORRA y RECREA tablas (¡CUIDADO!) - solo en desarrollo inicial
        await sequelize.sync({ alter: true });
        console.log('✅ [4/4] Base de datos y modelos sincronizados.'); // Log 4

        server.listen(port, () => { // Usa 'server' (el servidor HTTP que incluye Socket.IO)
            console.log(`🚀 Servidor backend completo (Express + Socket.IO) corriendo en http://localhost:${port}`);
        });

    } catch (error) {
        // Muestra el error específico que ocurrió
        console.error('❌ ERROR FATAL en startServer:', error);
        // Sugerencias comunes basadas en errores
        if (error instanceof Error) {
            if (error.message.includes('password authentication failed')) {
                console.error('👉 Sugerencia: Revisa la contraseña de la base de datos (DB_PASSWORD).');
            } else if (error.message.includes('database') && error.message.includes('does not exist')) {
                 console.error('👉 Sugerencia: Asegúrate de que el nombre de la base de datos (DB_NAME) es correcto y existe.');
            } else if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
                 console.error('👉 Sugerencia: Revisa el host (DB_HOST) y el puerto (DB_PORT) de la base de datos. ¿Está accesible la base de datos desde Docker?');
            }
        }
        process.exit(1); // Salir del proceso si hay un error crítico
    }
}

// Llama a la función para iniciar el servidor
startServer();