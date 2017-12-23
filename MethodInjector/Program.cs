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

        private static Assembly theyAreBillionsAssembly;

        // Called when the program is launched
        static void Main(string[] args)
        {
            LogMessage("Injector was started!");

            // Attempt to load the assembly
            theyAreBillionsAssembly = Assembly.LoadFile(Path.GetFullPath(theExecutable));
            if(theyAreBillionsAssembly == null)
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

            /*
                Perform patching
            */

            // Buildings dont cost anything to build
            ReplaceMethod("ZX.ZXLevelState", "CanPayResources", BindingFlags.Instance | BindingFlags.Public);
            ReplaceMethod("ZX.ZXLevelState", "PayResources", BindingFlags.Instance | BindingFlags.Public);

            // Allow hacked save games to be loaded
            ReplaceMethod("ZX.ZXGame", "CheckSaveGame", BindingFlags.Static | BindingFlags.NonPublic);

            // Enable dev tools & private stuff
            ReplaceMethod("ZX.ZXGame", "get_IsDevelopmentVersion", BindingFlags.Static | BindingFlags.Public);
            ReplaceMethod("ZX.ZXGame", "get_IsBetaPrivateVersion", BindingFlags.Static | BindingFlags.Public);
            
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

        // Replaces a method with one defined below
        public static void ReplaceMethod(string className, string methodName, BindingFlags attr)
        {
            // Grab the method we will replace
            Type theType = theyAreBillionsAssembly.GetType(className);
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
                    #endif
                }
            }

            LogMessage("Successfully replaced: " + className + " :: " + methodName);
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

        // Returns that this is a private build
        public static bool get_IsBetaPrivateVersion()
        {
            return true;
        }

        private static void LogMessage(string error)
        {
            System.IO.File.AppendAllText("inject.log", "error: " + error + Environment.NewLine);
        }
    }
}
