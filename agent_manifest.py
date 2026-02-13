import os
import sys
import asyncio
from dotenv import load_dotenv

# 1. PATH SETUP: Ensure we can import from the analytic service
# We are in foundry-suite/
# Service is in foundry-suite/solution-factory/services/analytic-service
SERVICE_ROOT = os.path.join(os.getcwd(), "solution-factory", "services", "analytic-service")
sys.path.append(SERVICE_ROOT)

# 2. ENVIRONMENT: Load the specific service env
load_dotenv(os.path.join(SERVICE_ROOT, ".env"))

# Import the core brain
try:
    from src.services.agents.forensic_chain import run_forensic_chain
except ImportError as e:
    print(f"CRITICAL ERROR: Could not import Forensic Chain. Check paths. {e}")
    sys.exit(1)

class ForensicResearchAgent:
    """
    The General Manager's primary research tool.
    Connects the CLI to the Spectre Intel Engine.
    """
    
    def __init__(self, agent_id="SPECTRE_GM_01"):
        self.agent_id = agent_id
        # Use a consistent UUID for the "General Manager" to track its own history in the Vault
        self.case_id = "00000000-0000-0000-0000-999999999999" 
        self.user_id = "00000000-0000-0000-0000-111111111111" 

    def execute_mission(self, objective: str, include_web: bool = True):
        """
        Runs the full Prosecutor/Skeptic/Judge chain on a strategic objective.
        Returns the final report.
        """
        print(f"🤖 AGENT [{self.agent_id}] ACCEPTED MISSION: {objective}")
        
        try:
            result = asyncio.run(run_forensic_chain(
                query=objective,
                case_id=self.case_id,
                user_id=self.user_id,
                include_general_knowledge=include_web
            ))
            
            print("\n" + "="*60)
            print("📜 MISSION REPORT")
            print("="*60)
            print(result.report)
            print("="*60 + "\n")
            
            return result.report
            
        except Exception as e:
            print(f"❌ MISSION FAILED: {e}")
            return str(e)

if __name__ == "__main__":
    # 1. Check for command line mission
    if len(sys.argv) > 1:
        mission = sys.argv[1]
    else:
        # Fallback Test Mission
        mission = "Analyze the current competitive landscape for 'AI Forensic Real Estate Tools' and identify key differentiators for 'Spectre Intel'."
    
    agent = ForensicResearchAgent()
    agent.execute_mission(mission)
