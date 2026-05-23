


class Company(Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    profile: Mapped["CompanyProfile"] = relationship(
        back_populates="company",
        uselist=False
    )

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    company_id: Mapped[str] = mapped_column(
        ForeignKey("companies.id"),
        primary_key=True
    )
    theme_color: Mapped[str] = mapped_column(
        String(7, default="#000000", nullable=False)
    )
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    primary_cta_text: Mapped[str] = mapped_column(
        String(100), 
        default="Вызвать персонал",
        nullable=False,
    )
    is_menu_active: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )
    is_bill_active: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )
    company: Mapped["Company"] = relationship(
        back_populates="profile"
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        nullable=False
    )