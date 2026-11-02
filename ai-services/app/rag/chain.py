from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from pydantic import BaseModel, Field

SYSTEM = """You are FoodHub's meal recommendation assistant.
Recommend ONLY dishes listed in MENU CONTEXT, referring to them by their exact id.
Never invent dishes, prices, ingredients or restaurants.
Respect the customer's dietary and budget constraints exactly.
If nothing in MENU CONTEXT fits, return an empty picks list and say so politely.
Keep the message to two friendly sentences and each reason under 20 words.

{format_instructions}"""

HUMAN = """Customer request: {query}

Customer profile: {profile}

Constraints: {constraints}

MENU CONTEXT (retrieved for this request):
{context}

Choose up to {limit} dishes."""


class Pick(BaseModel):
    food_id: int = Field(description="id of a dish from MENU CONTEXT")
    reason: str = Field(description="why this dish fits the request")


class LLMAnswer(BaseModel):
    message: str = Field(description="short friendly summary for the customer")
    picks: list[Pick] = Field(description="chosen dishes, best first")


def build_chain(llm: BaseChatModel) -> Runnable:
    parser = PydanticOutputParser(pydantic_object=LLMAnswer)
    prompt = ChatPromptTemplate.from_messages([("system", SYSTEM), ("human", HUMAN)])
    return prompt.partial(format_instructions=parser.get_format_instructions()) | llm | parser
