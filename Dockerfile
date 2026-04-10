FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 나중에 프론트엔드 팀의 dist 폴더가 나오면 아래 주석을 해제할 예정입니다.
# COPY ./dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
