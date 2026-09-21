require("dotenv").config();
const { makeClient, ensureLoggedIn } = require("./lib/auth");
const { prompt } = require("./lib/utils");

async function main() {
  const client = makeClient();
  console.log('Aplikasi dijalankan');
  await ensureLoggedIn(client);

  console.log('\nMenu Fitur:');
  console.log('1. Auto Mancing');
  console.log('2. Keluar');

  const choice = await prompt('Pilih fitur (1-2): ');

  switch (choice.trim()) {
    case '1':
      console.log('Menjalankan fitur Auto Mancing...');
      const mancingFeature = require('./features/mancing');
      await mancingFeature.run(client);
      break;
    case '2':
      console.log('Keluar...');
      process.exit(0);
      break;
    default:
      console.log('Pilihan tidak valid.');
      process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    while (true) {
      try {
        await main();
        break;
      } catch (err) {
        const errorString = String(err);
        const isNetworkError =
          errorString.includes('ETIMEDOUT') ||
          errorString.includes('ECONNABORTED') ||
          errorString.includes('ENETUNREACH') ||
          errorString.includes('TIMEOUT');

        if (isNetworkError) {
          console.error('\n[!] Koneksi terputus atau tidak stabil. Mencoba menyambung kembali dalam 5 detik...');
          console.error(`Detail error: ${err.message || err}\n`);

          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.error('[FATAL ERROR] Terjadi kesalahan yang tidak terduga:');
          console.error(err);
          console.log('Restarting bot in 10 seconds...');

          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
  })();
}
