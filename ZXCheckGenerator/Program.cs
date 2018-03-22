using Ionic.Zip;
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

        public static Assembly theyAreBillionsAssembly;

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

        public static void generateZXCheck(string pathToSaveFile)
        {
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
        }

        public static void extractPassword(string pathToSaveFile)
        {
            System.IO.File.AppendAllText("_passwords.txt", pathToSaveFile + Environment.NewLine);

            PropertyInfo propActiveZip = null;
            PropertyInfo propPassword = null;

            foreach (Assembly ass in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    Type ZipSerialization = ass.GetType("DXVision.Serialization.ZipSerializer");
                    if(ZipSerialization != null)
                    {
                        propActiveZip = ZipSerialization.GetProperty("Current", BindingFlags.Static | BindingFlags.Public);

                        if(propActiveZip == null)
                        {
                            Console.WriteLine("Error: prop Current is null");
                        }

                        propPassword = ZipSerialization.GetProperty("Password", BindingFlags.Instance | BindingFlags.Public);

                        if (propPassword == null)
                        {
                            Console.WriteLine("Error: prop password is null!");
                        }

                        if(propActiveZip != null && propPassword != null)
                        {
                            try
                            {
                                foreach(Type possibleType in theyAreBillionsAssembly.GetTypes())
                                {
                                    MethodInfo sigMatch = possibleType.GetMethod("ProcessSpecialKeys_KeyUp", BindingFlags.Instance | BindingFlags.NonPublic);
                                    if (sigMatch == null) continue;

                                    foreach (MethodInfo possibleFlag in possibleType.GetMethods(BindingFlags.NonPublic | BindingFlags.Static))
                                    {
                                        string retTurn = possibleFlag.ReturnType.FullName;

                                        if (retTurn != "System.Int32") continue;

                                        ParameterInfo[] flagParams = possibleFlag.GetParameters();
                                        if (flagParams.Length != 1) continue;
                                        if (flagParams[0].ParameterType.FullName != "System.String") continue;

                                        int flag = (int)possibleFlag.Invoke(null, new object[] { pathToSaveFile });

                                        foreach (MethodInfo possibleHelper in possibleType.GetMethods(BindingFlags.NonPublic | BindingFlags.Static))
                                        {
                                            ParameterInfo[] helperParams = possibleHelper.GetParameters();

                                            if (helperParams.Length != 3) continue;
                                            if (helperParams[0].ParameterType.FullName != "System.String") continue;
                                            if (helperParams[1].ParameterType.FullName != "System.Int32") continue;
                                            if (helperParams[2].ParameterType.FullName != "System.Boolean") continue;

                                            if (possibleHelper.ReturnType.FullName != "System.Void") continue;

                                            possibleHelper.Invoke(null, new object[] { pathToSaveFile, flag, true });

                                            object activeZip = propActiveZip.GetValue(null, null);
                                            string thePassword = (string)propPassword.GetValue(activeZip);

                                            // Did we find the password?
                                            if (thePassword == null || thePassword.Length <= 0) continue;

                                            Console.WriteLine("Found password = " + thePassword);
                                            System.IO.File.AppendAllText("_passwords.txt", "Password = " + thePassword + Environment.NewLine);
                                            
                                            // Get a working directory
                                            string myDir = GetTemporaryDirectory();

                                            using (ZipFile zip = ZipFile.Read(pathToSaveFile))
                                            {
                                                // Add the password
                                                zip.Password = thePassword;

                                                // Extract all
                                                try
                                                {
                                                    zip.ExtractAll(myDir);

                                                    using (ZipFile newZip = new ZipFile())
                                                    {
                                                        // Add the contents of the directory to my file
                                                        newZip.AddDirectory(myDir);

                                                        // Write it to disk
                                                        string saveFolder = Path.GetDirectoryName(pathToSaveFile);
                                                        string saveBaseName = Path.GetFileNameWithoutExtension(pathToSaveFile);

                                                        // Set the filename
                                                        string newRawFileName = saveBaseName + "_decrpyted.zxsav";
                                                        string newFileName = Path.Combine(saveFolder, newRawFileName); ;
                                                        newZip.Name = saveFolder + @"\" + saveBaseName + "_decrpyted.zxsav";

                                                        // Save it
                                                        newZip.Save();

                                                        // Sign it
                                                        generateZXCheck(newFileName);

                                                        // Cleanup the temp directory
                                                        DeleteDirectory(myDir);

                                                        // Tell the user that we decrypted it
                                                        Console.WriteLine("Successfully decrypted save file! New file called '" + newRawFileName + "'");
                                                    }
                                                }
                                                catch(Exception e)
                                                {
                                                    Console.WriteLine("Failed to extract zxsav :/");
                                                    Console.WriteLine(e.Message);
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                            catch
                            {
                                // Do nothing
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

        // Deletes a directory
        public static void DeleteDirectory(string target_dir)
        {
            string[] files = Directory.GetFiles(target_dir);
            string[] dirs = Directory.GetDirectories(target_dir);

            foreach (string file in files)
            {
                File.SetAttributes(file, FileAttributes.Normal);
                File.Delete(file);
            }

            foreach (string dir in dirs)
            {
                DeleteDirectory(dir);
            }

            Directory.Delete(target_dir, false);
        }

        // Returns a random temp directory to work with
        public static string GetTemporaryDirectory()
        {
            string tempDirectory = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
            Directory.CreateDirectory(tempDirectory);
            return tempDirectory;
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
            if(pathToSaveFile.IndexOf(".zxsav") == -1 && pathToSaveFile.IndexOf(".dat") == -1)
            {
                usageInstructions();
                return;
            }

            Console.WriteLine("Save file signer was started!");
            
            // Attempt to load the assembly
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
                Thread.Sleep(1000);

                // Generate ZXCheck
                generateZXCheck(pathToSaveFile);

                // Attempt to extract the password
                extractPassword(pathToSaveFile);
                
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
