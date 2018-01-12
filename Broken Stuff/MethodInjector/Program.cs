using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace MethodInjector
{
    class Program
    {
        // The name of the executable to inject into
        private static string theExecutable = "TheyAreBillions.exe";

        // The file to log to
        private static string logFileName = "MethodInjector_log.txt";

        // A reference to the assembly we are hacking
        private static Assembly theyAreBillionsAssembly;
        
        // Called when the program is launched
        static void Main(string[] args)
        {
            LogMessage("Injector was started!");

            // Attempt to load the assembly
            try
            {
                theyAreBillionsAssembly = Assembly.LoadFile(Path.GetFullPath(theExecutable));
                if (theyAreBillionsAssembly == null)
                {
                    throw new Exception("assembly didnt load :/");
                }
            }
            catch
            {
                LogMessage("Failed to load assembly, ensure this executable is run from the folder containing: " + theExecutable);
                return;
            }
            
            // Grab ZXProgram
            Type ZXProgram = theyAreBillionsAssembly.GetType("ZX.Program");
            if(ZXProgram == null)
            {
                LogMessage("Failed to load main program class :/");
                return;
            }

            bool allowModifiedSaveGames = true;
            bool enableDevTools = true;
            bool enableInstantBuild = true;
            bool allowFreeBuildings = true;
            bool enableCheats = true;

            try
            {
                // Read in all the lines of the config file
                string[] cfg = System.IO.File.ReadAllLines("config.txt");

                // Loop over each line in the config file
                foreach(string line in cfg)
                {
                    // Our config is   x = y, split based on an equals
                    string[] lineConfig = line.Split('=');
                    if(lineConfig.Length != 2)
                    {
                        // There should always be two sides of the equals
                        Console.WriteLine("Invalid config line: " + line);
                        continue;
                    }

                    // Remove any spaces, convert to lowercase
                    lineConfig[0] = lineConfig[0].Trim().ToLower();
                    lineConfig[1] = lineConfig[1].Trim().ToLower();

                    // Allow a lot of common variants
                    bool isEnabled = lineConfig[1] == "true" || lineConfig[1] == "1" || lineConfig[1] == "enabled";

                    switch (lineConfig[0])
                    {
                        case "allowmodifiedsavegames":
                            allowModifiedSaveGames = isEnabled;
                            break;

                        case "enabledevtools":
                            enableDevTools = isEnabled;
                            break;

                        case "enableinstantbuild":
                            enableInstantBuild = isEnabled;
                            break;

                        case "allowfreebuildings":
                            allowFreeBuildings = isEnabled;
                            break;

                        case "allowcheats":
                            enableCheats = isEnabled;
                            break;

                        default:
                            Console.WriteLine("Unknown config: " + lineConfig[0]);
                            break;
                    }
                }
            }
            catch
            {
                Console.WriteLine("Failed to parse config.txt");
            }

            /*
                Perform patching
            */

            // Allow cheats
            if(enableCheats)
            {
                ReplaceMethod("ZX.ZXGame", "get_CheatsEnabled", BindingFlags.Static | BindingFlags.Public);
            }

            // Allow hacked save games to be loaded
            if(allowModifiedSaveGames)
            {
                ReplaceMethod("ZX.ZXGame", "CheckSaveGame", BindingFlags.Static | BindingFlags.NonPublic);
            }

            // Enable dev tools & private stuff
            if (enableDevTools)
            {
                ReplaceMethod("ZX.ZXGame", "get_IsDevelopmentVersion", BindingFlags.Static | BindingFlags.Public);
                ReplaceMethod("ZX.ZXGame", "get_IsBetaPrivateVersion", BindingFlags.Static | BindingFlags.Public);
            }
            ReplaceMethod("ZX.ZXSteam", "ValidateSteamLicense", BindingFlags.Static | BindingFlags.Public, true, true);

            // Instant Build
            if (enableInstantBuild)
            {
                ReplaceMethod("ZX.ZXCommandDefaultParams", "get_BuildingTime", BindingFlags.Public | BindingFlags.Instance, false);
                ReplaceMethod("ZX.ZXEntityDefaultParams", "get_BuildingTime", BindingFlags.Public | BindingFlags.Instance, false);
            }

            // Buildings dont cost anything to build
            if(allowFreeBuildings)
            {
                ReplaceMethod("ZX.ZXLevelState", "CanPayResources", BindingFlags.Instance | BindingFlags.Public);
                ReplaceMethod("ZX.ZXLevelState", "PayResources", BindingFlags.Instance | BindingFlags.Public);
            }

            // Allow steam version to load
            

            // Get a reference to the Main method
            MethodInfo main = ZXProgram.GetMethod("Main", BindingFlags.Static | BindingFlags.NonPublic);
            if(main == null)
            {
                LogMessage("Failed to find the main method :/");
                return;
            }
            
            // Attempt to Invoke it
            try
            {
                main.Invoke(ZXProgram, new object[]
                {
                    args
                });
            }
            catch(Exception e)
            {
                LogMessage("Failed to start the game :/");
                LogMessage(e.Message);
                LogMessage(e.StackTrace);
            }
            
        }

        // Returns a field
        public static FieldInfo GetField(string className, string fieldName, BindingFlags attr)
        {
            // Grab the method we will replace
            Type theType = theyAreBillionsAssembly.GetType(className);
            if (theType == null)
            {
                LogMessage("Failed to find class: " + className);
                return null;
            }

            // Return the field
            FieldInfo field = theType.GetField(fieldName, attr);

            if(field == null)
            {
                LogMessage("Failed to find field: " + className + " :: " + fieldName);
            }
            return field;
        }

        // Replaces a method with one defined below
        public static void ReplaceMethod(string className, string methodName, BindingFlags attr, bool bothWays = true, bool showMessage=true)
        {
            // Grab the method we will replace
            Type theType = theyAreBillionsAssembly.GetType(className);
            if(theType == null)
            {
                LogMessage("Failed to find class: " + className);
                return;
            }

            MethodInfo targetMethod = theType.GetMethod(methodName, attr);
            if(targetMethod == null)
            {
                LogMessage("Failed to find method: " + className + " :: " + methodName);
                return;
            }

            // Grab the method we will inject
            MethodInfo newMethod = typeof(MethodInjector.Program).GetMethod(methodName, attr);
            if (newMethod == null)
            {
                LogMessage("Failed to find replacement method: " + className + " :: " + methodName);
                return;
            }

            // Prepare methods
            RuntimeHelpers.PrepareMethod(targetMethod.MethodHandle);
            RuntimeHelpers.PrepareMethod(newMethod.MethodHandle);

            unsafe
            {
                if (IntPtr.Size == 4)
                {
                    int* inj = (int*)newMethod.MethodHandle.Value.ToPointer() + 2;
                    int* tar = (int*)targetMethod.MethodHandle.Value.ToPointer() + 2;

                    #if DEBUG
                        //Console.WriteLine("\nVersion x86 Debug\n");

                        byte* injInst = (byte*)*inj;
                        byte* tarInst = (byte*)*tar;

                        int* injSrc = (int*)(injInst + 1);
                        int* tarSrc = (int*)(tarInst + 1);

                        *tarSrc = (((int)injInst + 5) + *injSrc) - ((int)tarInst + 5);
                    #else
                        //Console.WriteLine("\nVersion x86 Release\n");
                        *tar = *inj;
                    #endif
                }
                else
                {

                    long* inj = (long*)newMethod.MethodHandle.Value.ToPointer() + 1;
                    long* tar = (long*)targetMethod.MethodHandle.Value.ToPointer() + 1;
                    long tarOriginal = *tar;
                    #if DEBUG
                        //Console.WriteLine("\nVersion x64 Debug\n");
                        byte* injInst = (byte*)*inj;
                        byte* tarInst = (byte*)*tar;


                        int* injSrc = (int*)(injInst + 1);
                        int* tarSrc = (int*)(tarInst + 1);

                        *tarSrc = (((int)injInst + 5) + *injSrc) - ((int)tarInst + 5);
                    #else
                        //Console.WriteLine("\nVersion x64 Release\n");
                        *tar = *inj;

                        // Do we want to patch both directions of the method?
                        if (bothWays)
                        {
                            *inj = tarOriginal;
                        }
                    #endif
                }
            }

            // Log success
            if(showMessage)
            {
                LogMessage("Successfully replaced: " + className + " :: " + methodName);
            }
        }

        // Enable cheats
        public static bool get_CheatsEnabled()
        {
            return true;
        }

        // Replacement for can pay resources
        public bool CanPayResources(object ignoreThis)
        {
            return true;
        }

        // Replacement for pay resources
        public void PayResources(object ignoreThis)
        {
            // Do nothing
            return;
        }

        // Replacement for check save files
        private static bool CheckSaveGame(string file)
        {
            return true;
        }

        // Returns that this is a dev build
        public static bool get_IsDevelopmentVersion()
        {
            return true;
        }

        // Returns if this is a steam build
        public static bool ValidateSteamLicense(object ignoreMe)
        {
            return true;
        }

        // Returns that this is a private build
        public static bool get_IsBetaPrivateVersion()
        {
            return true;
        }

        // The amount of time that things take to build
        public int get_BuildingTime()
        {
            LogMessage("Getting build time!");
            // Lowest possible build time
            return 1;
        }
        
        private static void LogMessage(string message)
        {
            Console.WriteLine("MethodInjector: " + message);
            System.IO.File.AppendAllText(logFileName, message + Environment.NewLine);
        }
    }
}
