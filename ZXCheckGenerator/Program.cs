using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace ZXCheckGenerator
{
    class Program
    {
        // The name of the executable to inject into
        private static string theExecutable = "TheyAreBillions.exe";

        public static void usageInstructions()
        {
            Console.WriteLine("Please drag and drop a .zxsav file into this tool.");
            quitAfterDelay();
        }

        public static void quitAfterDelay()
        {
            Console.WriteLine("Quiting in 3 seconds...");
            System.Threading.Thread.Sleep(3000);
            Environment.Exit(0);
        }

        // Called when the program is launched
        static void Main(string[] args)
        {
            if(args.Length <= 0)
            {
                usageInstructions();
                return;
            }

            // Grab the path
            string pathToSaveFile = args[0];

            // Ensure the file exists
            if(!File.Exists(pathToSaveFile))
            {
                usageInstructions();
                return;
            }

            // Ensure this is a zxsav file
            if(pathToSaveFile.IndexOf(".zxsav") == -1)
            {
                usageInstructions();
                return;
            }

            Console.WriteLine("Save file signer was started!");
            
            // Attempt to load the assembly
            Assembly theyAreBillionsAssembly;
            try
            {
                theyAreBillionsAssembly = Assembly.LoadFile(AppDomain.CurrentDomain.BaseDirectory + theExecutable);
                if (theyAreBillionsAssembly == null)
                {
                    throw new Exception("assembly didnt load :/");
                }
            }
            catch
            {
                Console.WriteLine("Failed to load assembly, ensure this executable is run from the folder containing: " + theExecutable);
                quitAfterDelay();
                return;
            }

            // Grab ZXProgram
            Type ZXProgram = theyAreBillionsAssembly.GetType("ZX.Program");
            if (ZXProgram == null)
            {
                Console.WriteLine("Failed to load main program class :/");
                quitAfterDelay();
                return;
            }
            
            // Get a reference to the Main method
            MethodInfo main = ZXProgram.GetMethod("Main", BindingFlags.Static | BindingFlags.NonPublic);
            if (main == null)
            {
                Console.WriteLine("Failed to find the main method :/");
                quitAfterDelay();
                return;
            }

            Console.WriteLine("Attempting to sign: ");
            Console.WriteLine(pathToSaveFile);

            // Spin up a thread
            // We need to let the game start to load, then we can call methods from it
            new Thread(() => {
                // Sleep so the game can load
                Thread.Sleep(1);

                Console.WriteLine("Searching for game class...");
                try
                {
                    // Loop over all types in the assembly
                    Type[] types = theyAreBillionsAssembly.GetTypes();

                    foreach (Type type in types)
                    {
                        try
                        {
                            // Loop over all the public methods in the assembly
                            foreach (MethodInfo info in type.GetMethods())
                            {
                                string methodName = info.Name;

                                // We are looking for the following method
                                if (methodName == "get_GameAccount")
                                {
                                    Console.WriteLine("Located game class!");

                                    // Located the class we need to hit

                                    // Loop over the  class again, we need to locate the checksum method
                                    foreach (MethodInfo info2 in type.GetMethods(BindingFlags.Static | BindingFlags.NonPublic))
                                    {
                                        Console.WriteLine("Sigscanning for signing method...");

                                        // Grab the params, our function takes 2
                                        ParameterInfo[] parInfo = info2.GetParameters();
                                        if (parInfo.Length == 2)
                                        {
                                            // We are looking for String + Int32
                                            if (parInfo[0].ParameterType.Name == "String" && parInfo[1].ParameterType.Name == "Int32")
                                            {
                                                // Located our method
                                                Console.WriteLine("Found signing method! Signing...");

                                                object result = info2.Invoke(info, new object[]
                                                {
                                                        pathToSaveFile,
                                                        2
                                                });

                                                string resultNice = (string)result;

                                                string zxCheckPath = Path.ChangeExtension(pathToSaveFile, ".zxcheck");

                                                File.WriteAllText(zxCheckPath, resultNice);

                                                Console.WriteLine("Successfully created .zxcheck file! Signature = " + resultNice);

                                                quitAfterDelay();
                                                return;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch
                        {
                            // do nothing
                        }

                    }
                }
                catch
                {
                    // do nothing
                }

                Console.WriteLine("Failed to generate .zxcheck :(");
                quitAfterDelay();
            }).Start();
            
            // Invoke the actual program
            try
            {
                main.Invoke(ZXProgram, new object[]
                {
                    args
                });
            }
            catch
            {
                // Does not matter at all
            }
            
        }
    }
}
