using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace ZXCheckGenerator_DecryptZXSav
{
    class Program
    {
        static void Main(string[] args)
        {
            // Grab the save file
            string pathToSaveFile = ZXCheckLib.ZXCheckLib.getSavFileFromArgs(args);

            Console.WriteLine("Save file decrypter started!");

            // Prepare billions
            ZXCheckLib.ZXCheckLib.prepareBillions();

            Console.WriteLine("Attempting to decrypt: ");
            Console.WriteLine(pathToSaveFile);

            // Spin up a thread
            // We need to let the game start to load, then we can call methods from it
            new Thread(() => {
                // Sleep so the game can load
                Thread.Sleep(1000);

                // Generate ZXCheck
                ZXCheckLib.ZXCheckLib.generateZXCheck(pathToSaveFile);

                // Attempt to extract the password
                ZXCheckLib.ZXCheckLib.extractPassword(pathToSaveFile, false, true);

                ZXCheckLib.ZXCheckLib.quitAfterDelay();
            }).Start();

            // Do the injection
            ZXCheckLib.ZXCheckLib.injectBillions(args);
        }
    }
}
