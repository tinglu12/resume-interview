import uuid

import boto3
from botocore.config import Config

from config import settings

_endpoint = (
    settings.r2_endpoint
    if settings.r2_endpoint
    else f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"
)

# MinIO and other S3-compatible endpoints need path-style addressing; R2 uses the default virtual host style.
_use_path_style = bool(settings.r2_endpoint)
_botocore = Config(
    signature_version="s3v4",
    **({"s3": {"addressing_style": "path"}} if _use_path_style else {}),
)

s3 = boto3.client(
    "s3",
    endpoint_url=_endpoint,
    aws_access_key_id=settings.r2_access_key_id,
    aws_secret_access_key=settings.r2_secret_access_key,
    config=_botocore,
    region_name="us-east-1" if _use_path_style else "auto",
)


def generate_presigned_upload_url(folder: str, content_type: str) -> tuple[str, str]:
    """Returns (object_key, presigned_put_url)."""
    key = f"{folder}/{uuid.uuid4()}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": key, "ContentType": content_type},
        ExpiresIn=300,
    )
    return key, url


def get_public_url(key: str) -> str:
    return f"{settings.r2_public_url}/{key}"


def upload_bytes(data: bytes, key: str, content_type: str) -> str:
    """Upload bytes directly and return the public URL."""
    s3.put_object(Bucket=settings.r2_bucket_name, Key=key, Body=data, ContentType=content_type)
    return get_public_url(key)


def download_bytes(key: str) -> bytes:
    response = s3.get_object(Bucket=settings.r2_bucket_name, Key=key)
    return response["Body"].read()
