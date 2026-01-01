from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    due_day: Optional[int] = None
    color: str
    order: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CategoryCreate(BaseModel):
    name: str
    due_day: Optional[int] = None
    color: str
    order: int


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    month: int
    year: int
    planned_value: float
    actual_value: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransactionCreate(BaseModel):
    category_id: str
    month: int
    year: int
    planned_value: float
    actual_value: float
    notes: Optional[str] = None


class TransactionUpdate(BaseModel):
    planned_value: Optional[float] = None
    actual_value: Optional[float] = None
    notes: Optional[str] = None


class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    year: int
    category_id: str
    monthly_target: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BudgetCreate(BaseModel):
    year: int
    category_id: str
    monthly_target: float


class Income(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    month: int
    year: int
    aposentadoria: float
    salario: float
    recursos_externos: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IncomeCreate(BaseModel):
    month: int
    year: int
    aposentadoria: float
    salario: float
    recursos_externos: float
    notes: Optional[str] = None


class IncomeUpdate(BaseModel):
    aposentadoria: Optional[float] = None
    salario: Optional[float] = None
    recursos_externos: Optional[float] = None
    notes: Optional[str] = None


@api_router.get("/")
async def root():
    return {"message": "Finance Control API"}


@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    category = Category(**input.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.categories.insert_one(doc)
    return category


@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    
    return categories


@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, input: CategoryCreate):
    update_doc = input.model_dump()
    
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(category['created_at'], str):
        category['created_at'] = datetime.fromisoformat(category['created_at'])
    
    return Category(**category)


@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.transactions.delete_many({"category_id": category_id})
    await db.budgets.delete_many({"category_id": category_id})
    
    return {"message": "Category deleted successfully"}


@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    transaction = Transaction(**input.model_dump())
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.transactions.insert_one(doc)
    return transaction


@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(year: Optional[int] = None, category_id: Optional[str] = None):
    query = {}
    if year:
        query["year"] = year
    if category_id:
        query["category_id"] = category_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    
    for trans in transactions:
        if isinstance(trans['created_at'], str):
            trans['created_at'] = datetime.fromisoformat(trans['created_at'])
        if isinstance(trans['updated_at'], str):
            trans['updated_at'] = datetime.fromisoformat(trans['updated_at'])
    
    return transactions


@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionUpdate):
    update_doc = input.model_dump(exclude_none=True)
    update_doc['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if isinstance(transaction['created_at'], str):
        transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    if isinstance(transaction['updated_at'], str):
        transaction['updated_at'] = datetime.fromisoformat(transaction['updated_at'])
    
    return Transaction(**transaction)


@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {"message": "Transaction deleted successfully"}


@api_router.post("/budgets", response_model=Budget)
async def create_budget(input: BudgetCreate):
    budget = Budget(**input.model_dump())
    doc = budget.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.budgets.insert_one(doc)
    return budget


@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(year: Optional[int] = None):
    query = {}
    if year:
        query["year"] = year
    
    budgets = await db.budgets.find(query, {"_id": 0}).to_list(100)
    
    for budget in budgets:
        if isinstance(budget['created_at'], str):
            budget['created_at'] = datetime.fromisoformat(budget['created_at'])
    
    return budgets


@api_router.get("/summary/{year}")
async def get_year_summary(year: int):
    transactions = await db.transactions.find({"year": year}, {"_id": 0}).to_list(1000)
    incomes = await db.incomes.find({"year": year}, {"_id": 0}).to_list(100)
    
    total_planned = sum(t['planned_value'] for t in transactions)
    total_actual = sum(t['actual_value'] for t in transactions)
    
    # Calcular receitas totais
    total_income = sum((i['aposentadoria'] + i['salario'] + i['recursos_externos']) for i in incomes)
    
    monthly_summary = {}
    for month in range(1, 13):
        month_trans = [t for t in transactions if t['month'] == month]
        month_income = [i for i in incomes if i['month'] == month]
        
        despesas = sum(t['actual_value'] for t in month_trans)
        receitas = sum((i['aposentadoria'] + i['salario'] + i['recursos_externos']) for i in month_income)
        
        monthly_summary[month] = {
            "planned": sum(t['planned_value'] for t in month_trans),
            "actual": despesas,
            "income": receitas,
            "balance": receitas - despesas
        }
    
    category_summary = {}
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    
    for cat in categories:
        cat_trans = [t for t in transactions if t['category_id'] == cat['id']]
        category_summary[cat['id']] = {
            "name": cat['name'],
            "planned": sum(t['planned_value'] for t in cat_trans),
            "actual": sum(t['actual_value'] for t in cat_trans),
            "color": cat['color']
        }
    
    return {
        "year": year,
        "total_planned": total_planned,
        "total_actual": total_actual,
        "total_income": total_income,
        "balance": total_income - total_actual,
        "monthly_summary": monthly_summary,
        "category_summary": category_summary
    }


@api_router.post("/init-default-categories")
async def init_default_categories():
    existing = await db.categories.count_documents({})
    if existing > 0:
        return {"message": "Categories already exist"}
    
    default_categories = [
        {"name": "Manut. Tiggo", "due_day": None, "color": "#FFADAD", "order": 1},
        {"name": "Mantimento (Dia 20)", "due_day": 20, "color": "#FFD6A5", "order": 2},
        {"name": "Brisanet (Dia 05)", "due_day": 5, "color": "#FDFFB6", "order": 3},
        {"name": "Energia (Dia 09)", "due_day": 9, "color": "#CAFFBF", "order": 4},
        {"name": "Cartão C&A (20)", "due_day": 20, "color": "#9BF6FF", "order": 5},
        {"name": "Condom. (Dia 25)", "due_day": 25, "color": "#A0C4FF", "order": 6},
        {"name": "Inglês do JP dia 09", "due_day": 9, "color": "#BDB2FF", "order": 7},
        {"name": "Internet (Dia 20)", "due_day": 20, "color": "#FFC6FF", "order": 8},
        {"name": "Veículos (Dia 20/28)", "due_day": 20, "color": "#E5E5E5", "order": 9},
        {"name": "Gastos extras", "due_day": None, "color": "#F4A261", "order": 10},
        {"name": "Cel. Cartão (Dia 25)", "due_day": 25, "color": "#2A9D8F", "order": 11},
        {"name": "Visa (Dia 28)", "due_day": 28, "color": "#E9C46A", "order": 12},
        {"name": "IPTU (Dia 10)", "due_day": 10, "color": "#F4A261", "order": 13},
        {"name": "Gastos Diversos", "due_day": None, "color": "#E76F51", "order": 14},
        {"name": "Parc. IR 2024", "due_day": None, "color": "#8ECAE6", "order": 15},
        {"name": "Água (Dia 30)", "due_day": 30, "color": "#219EBC", "order": 16}
    ]
    
    for cat_data in default_categories:
        category = Category(**cat_data)
        doc = category.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.categories.insert_one(doc)
    
    return {"message": f"Initialized {len(default_categories)} default categories"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()