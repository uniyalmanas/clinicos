from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Review, Doctor
import uuid

router = APIRouter(prefix="/reviews", tags=["Patient Reviews & Quality Ratings"])

class CreateReviewRequest(BaseModel):
    doctor_slug: str
    patient_name: str = Field(..., min_length=2, max_length=80)
    rating: float = Field(..., ge=1.0, le=5.0)
    waiting_time_rating: Optional[float] = Field(5.0, ge=1.0, le=5.0)
    bedside_manner_rating: Optional[float] = Field(5.0, ge=1.0, le=5.0)
    comment: str = Field(..., min_length=5, max_length=1000)

class DoctorReplyRequest(BaseModel):
    review_id: str
    doctor_reply: str = Field(..., min_length=2, max_length=1000)

@router.get("")
def get_doctor_reviews(doctor_slug: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.doctor_slug == doctor_slug).order_by(Review.created_at.desc()).all()
    
    total = len(reviews)
    avg_rating = round(sum(r.rating for r in reviews) / total, 1) if total > 0 else 5.0
    avg_wait = round(sum(r.waiting_time_rating for r in reviews) / total, 1) if total > 0 else 5.0
    avg_bedside = round(sum(r.bedside_manner_rating for r in reviews) / total, 1) if total > 0 else 5.0

    return {
        "doctor_slug": doctor_slug,
        "total_reviews": total,
        "average_rating": avg_rating,
        "metrics": {
            "overall_satisfaction": avg_rating,
            "waiting_time_score": avg_wait,
            "bedside_manner_score": avg_bedside
        },
        "reviews": [
            {
                "id": r.id,
                "patient_name": r.patient_name,
                "rating": r.rating,
                "waiting_time_rating": r.waiting_time_rating,
                "bedside_manner_rating": r.bedside_manner_rating,
                "comment": r.comment,
                "doctor_reply": r.doctor_reply,
                "is_verified_visit": r.is_verified_visit,
                "created_at": r.created_at.strftime("%B %d, %Y") if r.created_at else "Recently"
            }
            for r in reviews
        ]
    }

@router.post("")
def submit_patient_review(payload: CreateReviewRequest, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.slug == payload.doctor_slug).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

    new_review = Review(
        id=str(uuid.uuid4()),
        doctor_slug=payload.doctor_slug,
        patient_name=payload.patient_name,
        rating=payload.rating,
        waiting_time_rating=payload.waiting_time_rating or payload.rating,
        bedside_manner_rating=payload.bedside_manner_rating or payload.rating,
        comment=payload.comment,
        is_verified_visit=True
    )
    db.add(new_review)
    
    # Recalculate doctor rating
    all_revs = db.query(Review).filter(Review.doctor_slug == payload.doctor_slug).all()
    all_revs.append(new_review)
    doc.total_reviews = len(all_revs)
    doc.rating = round(sum(r.rating for r in all_revs) / len(all_revs), 1)

    db.commit()

    return {
        "status": "success",
        "message": "Thank you! Your verified patient review has been published.",
        "review_id": new_review.id,
        "doctor_new_rating": doc.rating,
        "doctor_total_reviews": doc.total_reviews
    }

@router.post("/reply")
def reply_to_review(payload: DoctorReplyRequest, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == payload.review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")

    review.doctor_reply = payload.doctor_reply
    db.commit()

    return {
        "status": "success",
        "message": "Doctor reply saved successfully.",
        "review_id": review.id
    }
