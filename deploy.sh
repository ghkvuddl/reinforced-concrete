read -p "next.config.mjs파일에서 output: export로 설정되어있습니까?: (y/n) " answer
# 그냥 엔터 눌렀을경우 y로 간주
if [ -z "$answer"]; then
	answer="y"
fi

if [ "$answer" = "y" ]; then
	npm run build && aws s3 sync out s3://reinforced-concrete --delete --include "*" --profile snsshvdl9820
	# npm run build && aws s3 sync out s3://sturctural-concrete --delete --include "*" --profile snsshvdl9820
else
	echo "output: export로 설정후 배포해주세요."
fi