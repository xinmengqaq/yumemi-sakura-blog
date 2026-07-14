package com.xinmengqaq.springboot.admin.testsupport;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.annotation.MapperScan;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.test.context.jdbc.Sql;

import static org.assertj.core.api.Assertions.assertThat;

@MybatisTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:basic_query_test;MODE=PostgreSQL;DATABASE_TO_UPPER=false",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "mybatis.mapper-locations=classpath*:mapper/**/*.xml"
})
@MapperScan("com.xinmengqaq.springboot.admin.testsupport")
@Sql(statements = {
        "drop table if exists basic_query",
        "create table basic_query (id int primary key, name varchar(50) not null)",
        "insert into basic_query (id, name) values (1, 'basic-query')"
})
class BasicQueryMapperTest {

    @Autowired
    private BasicQueryMapper basicQueryMapper;

    @Test
    @DisplayName("MyBatis XML 基础查询可以正常返回数据")
    void testSelectNameByIdReturnsName() {
        String name = basicQueryMapper.selectNameById(1);

        assertThat(name).isEqualTo("basic-query");
    }

    @Test
    @DisplayName("MyBatis XML 查询不到数据时返回 null")
    void testSelectNameByIdReturnsNullWhenMissing() {
        String name = basicQueryMapper.selectNameById(999);

        assertThat(name).isNull();
    }
    @SpringBootConfiguration
    static class TestApplication {
    }
}

