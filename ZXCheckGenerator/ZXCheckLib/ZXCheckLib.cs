using Ionic.Zip;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace ZXCheckLib
{
    public class ZXCheckLib
    {
        // The name of the executable to inject into
        private static string theExecutable = "TheyAreBillions.exe";

        // Refernece to TaB Assembly
        public static Assembly theyAreBillionsAssembly;

        // References Billions Main File
        public static MethodInfo billionsMain;

        // References the ZXProgram type
        public static Type ZXProgram;

        public static void prepareBillions()
        {
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
            ZXProgram = theyAreBillionsAssembly.GetType("ZX.Program");
            if (ZXProgram == null)
            {
                Console.WriteLine("Failed to load main program class :/");
                quitAfterDelay();
                return;
            }

            // Get a reference to the Main method
            billionsMain = ZXProgram.GetMethod("Main", BindingFlags.Static | BindingFlags.NonPublic);
            if (billionsMain == null)
            {
                Console.WriteLine("Failed to find the main method :/");
                quitAfterDelay();
                return;
            }
        }

        public static void injectBillions(string[] args)
        {
            // Invoke the actual program
            try
            {
                billionsMain.Invoke(ZXProgram, new object[]
                {
                    args
                });
            }
            catch(Exception e)
            {
                // Does not matter at all
                Console.WriteLine(e.Message);
            }
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

        public static void extractPassword(string pathToSaveFile, bool addPassword = false, bool doDecrypt=false)
        {
            System.IO.File.AppendAllText("_passwords.txt", pathToSaveFile + Environment.NewLine);

            PropertyInfo propActiveZip = null;
            PropertyInfo propPassword = null;

            foreach (Assembly ass in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    Type ZipSerialization = ass.GetType("DXVision.Serialization.ZipSerializer");
                    if (ZipSerialization != null)
                    {
                        propActiveZip = ZipSerialization.GetProperty("Current", BindingFlags.Static | BindingFlags.Public);

                        if (propActiveZip == null)
                        {
                            Console.WriteLine("Error: prop Current is null");
                        }

                        propPassword = ZipSerialization.GetProperty("Password", BindingFlags.Instance | BindingFlags.Public);

                        if (propPassword == null)
                        {
                            Console.WriteLine("Error: prop password is null!");
                        }

                        if (propActiveZip != null && propPassword != null)
                        {
                            try
                            {
                                foreach (Type possibleType in theyAreBillionsAssembly.GetTypes())
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
                                                }
                                                catch (Exception e)
                                                {
                                                    Console.WriteLine("Failed to extract zxsav :/");
                                                    Console.WriteLine(e.Message);
                                                    return;
                                                }
                                            }

                                            // Write it to disk
                                            string saveFolder = Path.GetDirectoryName(pathToSaveFile);
                                            string saveBaseName = Path.GetFileNameWithoutExtension(pathToSaveFile);

                                            if(doDecrypt)
                                            {
                                                // Craete a decrypted one
                                                using (ZipFile newZip = new ZipFile())
                                                {
                                                    //newZip.Password = thePassword;

                                                    // Add the contents of the directory to my file
                                                    newZip.AddDirectory(myDir);

                                                    // Set the filename
                                                    string newRawFileName = saveBaseName + "_decrpyted.zxsav";
                                                    string newFileNameBackup = Path.Combine(saveFolder, newRawFileName); ;
                                                    newZip.Name = saveFolder + @"\" + saveBaseName + "_decrpyted.zxsav";

                                                    // Save it
                                                    newZip.Save();

                                                    // Sign it
                                                    generateZXCheck(newFileNameBackup);

                                                    // Tell the user that we decrypted it
                                                    Console.WriteLine("Successfully decrypted save file! New file called '" + newRawFileName + "'");
                                                }
                                            }

                                            // Should we add a password to this?
                                            if(addPassword)
                                            {
                                                // Figure out a filename that isn't taken
                                                int i = 1;
                                                string newFileName = null;
                                                while (true)
                                                {
                                                    newFileName = pathToSaveFile + ".bak" + i;

                                                    if (File.Exists(newFileName))
                                                    {
                                                        ++i;
                                                    }
                                                    else
                                                    {
                                                        break;
                                                    }
                                                }

                                                // Move the old zip
                                                try
                                                {
                                                    File.Copy(pathToSaveFile, newFileName);
                                                }
                                                catch
                                                {
                                                    // Cleanup the temp directory
                                                    DeleteDirectory(myDir);

                                                    Console.WriteLine("Unable to backup zxsav -- Is it open? " + pathToSaveFile);
                                                    return;
                                                }

                                                // Let's modify the times on the dir
                                                Directory.SetCreationTime(myDir, DateTime.Now);
                                                Directory.SetLastWriteTime(myDir, DateTime.Now);
                                                Directory.SetLastAccessTime(myDir, DateTime.Now);

                                                foreach(string fileName in Directory.GetFiles(myDir))
                                                {
                                                    string toChange = Path.Combine(myDir, fileName);

                                                    File.SetCreationTime(toChange, DateTime.Now);
                                                    File.SetLastWriteTime(toChange, DateTime.Now);
                                                    File.SetLastAccessTime(toChange, DateTime.Now);
                                                }

                                                // Update edit time
                                                File.SetCreationTime(pathToSaveFile, DateTime.Now);
                                                File.SetLastWriteTime(pathToSaveFile, DateTime.Now);
                                                File.SetLastAccessTime(pathToSaveFile, DateTime.Now);

                                                // Delete old save file
                                                //File.Delete(pathToSaveFile);
                                                
                                                // Add a password to teh original
                                                using (ZipFile newZip = new ZipFile())
                                                {
                                                    // Add a password
                                                    newZip.Password = thePassword;

                                                    // Add the contents of the directory to my file
                                                    newZip.AddDirectory(myDir);

                                                    // Set the filename
                                                    newZip.Name = pathToSaveFile; //saveFolder + @"\" + saveBaseName + ".zxsav";
                                                    
                                                    // Save it
                                                    newZip.Save();

                                                    // Sign it
                                                    generateZXCheck(pathToSaveFile);

                                                    // Cleanup the temp directory
                                                    DeleteDirectory(myDir);

                                                    // Tell the user that we decrypted it
                                                    Console.WriteLine("Added a password successfully to '" + pathToSaveFile + "'");
                                                }

                                                // Update edit time
                                                File.SetCreationTime(pathToSaveFile, DateTime.Now);
                                                File.SetLastWriteTime(pathToSaveFile, DateTime.Now);
                                                File.SetLastAccessTime(pathToSaveFile, DateTime.Now);
                                            }
                                        }

                                    }
                                }
                            }
                            catch(Exception e)
                            {
                                // Do nothing
                                Console.WriteLine(e.Message);
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

        public static void usageInstructions()
        {
            Console.WriteLine("Please drag and drop a .zxsav file into this tool.");
            quitAfterDelay();
        }

        public static string getSavFileFromArgs(string[] args)
        {
            if (args.Length <= 0)
            {
                usageInstructions();
                return null;
            }

            // Grab the path
            string pathToSaveFile = args[0];

            // Ensure the file exists
            if (!File.Exists(pathToSaveFile))
            {
                usageInstructions();
                return null;
            }

            // Ensure this is a zxsav file
            if (pathToSaveFile.IndexOf(".zxsav") == -1 && pathToSaveFile.IndexOf(".dat") == -1)
            {
                usageInstructions();
                return null;
            }

            return pathToSaveFile;
        }
    }
}
